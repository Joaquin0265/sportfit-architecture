const conectarMongoDB = require('../mongoDb');
const resenasController = {};

// 📝 1. GUARDAR UNA NUEVA RESEÑA (POST)
resenasController.crearResena = async (req, res) => {
    try {
        const { id_producto, estrellas, texto, nombre } = req.body;

        if (!id_producto || !estrellas || !texto) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        let nombreFinal = nombre || 'Usuario SportFit';
        if (!nombre && req.usuario) {
            nombreFinal = req.usuario.nombre || req.usuario.username || req.usuario.nombre_usuario || nombreFinal;
        }

        const db = await conectarMongoDB();
        const coleccion = db.collection('reviews');

        const nuevaResena = {
            id_producto: parseInt(id_producto),
            nombre: nombreFinal,
            estrellas: parseInt(estrellas),
            texto: texto,
            fecha: new Date().toLocaleDateString('es-ES'),
            reacciones: { '👍': 0, '👎': 0, '❤️': 0, '😮': 0 }, // 🔥 Corregido con el Dislike inicial
            respuestas: []
        };

        await coleccion.insertOne(nuevaResena);
        res.status(201).json({ mensaje: '¡Reseña publicada con éxito!', resena: nuevaResena });
    } catch (error) {
        console.error('❌ ERROR DENTRO DEL CONTROLLER DE RESEÑAS:', error);
        res.status(500).json({ error: 'Hubo un error en el servidor NoSQL.' });
    }
};

// 📖 2. OBTENER RESEÑAS DE UN PRODUCTO ESPECÍFICO (GET)
resenasController.obtenerResenasPorProducto = async (req, res) => {
    try {
        const { idProducto } = req.params;
        const db = await conectarMongoDB();
        const coleccion = db.collection('reviews');
        const listaResenas = await coleccion.find({ id_producto: parseInt(idProducto) }).toArray();
        res.json(listaResenas);
    } catch (error) {
        console.error('❌ Error al obtener reseñas de Mongo:', error);
        res.status(500).json({ error: 'No se pudieron cargar las opiniones.' });
    }
};

// 😀 3. REACCIONAR A UNA RESEÑA CON UN EMOTICÓN (PATCH)

resenasController.reaccionarAResena = async (req, res) => {
    try {
        const { idResena } = req.params;
        const { emoticon } = req.body;
        
        let identificadorUnico = null;
        if (req.usuario) {
            identificadorUnico = req.usuario.id_usuario || req.usuario.id || req.usuario.nombre || req.usuario.username;
        }

        if (!identificadorUnico) {
            return res.status(401).json({ error: 'Usuario no identificado en el sistema.' });
        }

        const emoticonesValidos = ['👍', '👎', '❤️', '😮'];
        if (!emoticonesValidos.includes(emoticon)) {
            return res.status(400).json({ error: 'Emoticón no permitido.' });
        }

        const { ObjectId } = require('mongodb');
        const db = await conectarMongoDB();
        const coleccion = db.collection('reviews');

        const resena = await coleccion.findOne({ _id: new ObjectId(idResena) });
        if (!resena) {
            return res.status(404).json({ error: 'La opinión no existe.' });
        }

        // Aseguramos estructuras limpias
        if (!resena.reacciones) resena.reacciones = { '👍': 0, '👎': 0, '❤️': 0, '😮': 0 };
        if (!resena.usuarios_reacciones) resena.usuarios_reacciones = [];

        // Buscamos si este usuario ya dejó alguna reacción previa en esta reseña
        // Guardaremos los registros como objetos: { usuario: "id", emoticon: "👍" }
        const reaccionPrevia = resena.usuarios_reacciones.find(u => u.usuario === identificadorUnico.toString());

        if (reaccionPrevia) {
            // Caso 1: El usuario le dio clic EXACTAMENTE al mismo emoticón -> Se lo quitamos (Deshacer voto)
            if (reaccionPrevia.emoticon === emoticon) {
                await coleccion.updateOne(
                    { _id: new ObjectId(idResena) },
                    { 
                        $inc: { [`reacciones.${emoticon}`]: -1 },
                        $pull: { usuarios_reacciones: { usuario: identificadorUnico.toString() } }
                    }
                );
                return res.json({ mensaje: 'Reacción removida', accion: 'quitado', emoticon });
            } 
            
            // Caso 2: El usuario cambió de opinión (ej: de 👍 a 👎) -> Restamos al viejo y sumamos al nuevo
            const emoticonViejo = reaccionPrevia.emoticon;
            await coleccion.updateOne(
                { _id: new ObjectId(idResena), "usuarios_reacciones.usuario": identificadorUnico.toString() },
                { 
                    $inc: { 
                        [`reacciones.${emoticonViejo}`]: -1, 
                        [`reacciones.${emoticon}`]: 1 
                    },
                    $set: { "usuarios_reacciones.$.emoticon": emoticon }
                }
            );
            return res.json({ mensaje: 'Reacción actualizada', accion: 'cambiado', emoticonViejo, emoticonNuevo: emoticon });

        } else {
            // Caso 3: El usuario no ha reaccionado nunca -> Sumamos directo
            const nuevaInteraccion = {
                usuario: identificadorUnico.toString(),
                emoticon: emoticon
            };

            await coleccion.updateOne(
                { _id: new ObjectId(idResena) },
                { 
                    $inc: { [`reacciones.${emoticon}`]: 1 },
                    $push: { usuarios_reacciones: nuevaInteraccion }
                }
            );
            return res.json({ mensaje: 'Reacción guardada', accion: 'sumado', emoticon });
        }

    } catch (error) {
        console.error('❌ Error al alternar reacción única en Mongo:', error);
        res.status(500).json({ error: 'No se pudo procesar la reacción única.' });
    }
};

// 👑 4. AGREGAR RESPUESTA DEL ADMINISTRADOR (POST)
resenasController.responderAResena = async (req, res) => {
    try {
        const { idResena } = req.params;
        const { texto } = req.body;

        const usuarioTemporal = req.usuario || {};
        if (!texto || texto.trim() === '') {
            return res.status(400).json({ error: 'La respuesta no puede enviarse vacía.' });
        }

        let nombreAdmin = 'Soporte SportFit';
        if (req.usuario) {
            nombreAdmin = req.usuario.nombre || req.usuario.username || nombreAdmin;
        }

        const { ObjectId } = require('mongodb');
        const db = await conectarMongoDB();
        const coleccion = db.collection('reviews');

        const nuevaRespuesta = {
            id_respuesta: new ObjectId(),
            nombre: nombreAdmin,
            texto: texto.trim(),
            fecha: new Date().toLocaleDateString('es-ES')
        };

        await coleccion.updateOne(
            { _id: new ObjectId(idResena) },
            { $push: { respuestas: nuevaRespuesta } }
        );

        res.status(201).json({ mensaje: '¡Respuesta publicada!', respuesta: nuevaRespuesta });
    } catch (error) {
        console.error('❌ Error interno al procesar respuesta:', error);
        res.status(500).json({ error: 'Fallo interno de procesamiento.' });
    }
};

module.exports = resenasController;