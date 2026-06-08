let cantidadSeleccionada = 1;
let productoActual = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener ID de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');

    if (!idProducto) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // 2. Consultar al servidor por este producto específico
        const res = await fetch('/api/productos/' + idProducto);
        productoActual = await res.json();

        if (productoActual) {
            // 3. Llenar la vista principal
            document.getElementById('det-img').src = productoActual.imagen_url;
            document.getElementById('det-nombre').innerText = productoActual.nombre;
            document.getElementById('bread-nombre').innerText = productoActual.nombre;
            document.getElementById('det-precio').innerText = 'S/ ' + productoActual.precio;
            document.getElementById('det-desc').innerText = productoActual.descripcion;
            document.getElementById('det-id').innerText = 'Código: ' + productoActual.id_producto;

            // 4. Configurar botón de agregar
            const btn = document.getElementById('det-btn');
            if (productoActual.stock <= 0) {
                btn.disabled = true;
                btn.innerText = "AGOTADO";
                document.querySelector('.selector-cantidad').parentElement.style.display = 'none';
            } else {
                btn.onclick = () => {
                    for(let i = 0; i < cantidadSeleccionada; i++) {
                        agregarAlCarrito(
                            productoActual.id_producto, 
                            productoActual.nombre, 
                            productoActual.precio, 
                            productoActual.imagen_url
                        );
                    }
                    const offcanvasCarrito = document.getElementById('menuCarrito');
                    const bsOffcanvas = new bootstrap.Offcanvas(offcanvasCarrito);
                    bsOffcanvas.show();
                };
            }

            cargarRelacionados(productoActual.id_categoria, productoActual.id_producto);
        }
    } catch (error) {
        console.error("Error cargando detalle:", error);
    }
});

function ajustarCantidadDetalle(cambio) {
    cantidadSeleccionada += cambio;
    if (cantidadSeleccionada < 1) {
        cantidadSeleccionada = 1;
    }
    if (productoActual && cantidadSeleccionada > productoActual.stock) {
        cantidadSeleccionada = productoActual.stock;
        alert('Lo sentimos, solo quedan ' + productoActual.stock + ' unidades disponibles.');
    }
    document.getElementById('cant-detalle').innerText = cantidadSeleccionada;
}

async function cargarRelacionados(idCategoria, idActual) {
    try {
        const res = await fetch('/api/productos');
        const todosLosProductos = await res.json();

        const relacionados = todosLosProductos.filter(p => 
            p.id_categoria == idCategoria && p.id_producto != idActual
        );

        const contenedor = document.getElementById('productos-relacionados');
        if (!contenedor) return;

        if (relacionados.length === 0) {
            contenedor.innerHTML = '<p class="text-muted small ps-3">No hay productos similares por ahora.</p>';
            return;
        }

        contenedor.innerHTML = relacionados.slice(0, 4).map(p => `
            <div class="col-6 col-md-3">
                <div class="card h-100 border-0 shadow-sm card-relacionado">
                    <a href="detalle.html?id=${p.id_producto}" class="text-decoration-none">
                        <div class="p-3 text-center">
                            <img src="${p.imagen_url}" class="img-fluid mb-2" style="height: 120px; object-fit: contain;" 
                                 onerror="this.onerror=null; this.src='https://placehold.co/300x300?text=SportFit';">
                            <h6 class="text-dark small fw-bold text-truncate">${p.nombre}</h6>
                            <p class="text-primary fw-bold mb-0">S/ ${p.precio}</p>
                        </div>
                    </a>
                </div>
            </div>`
        ).join('');

    } catch (error) {
        console.error("Error cargando relacionados:", error);
    }
}

// ==========================================
// 💬 LÓGICA DE COMENTARIOS CONECTADA A MONGODB 🔥
// ==========================================

async function renderizarComentarios() {
    const contenedor = document.getElementById('lista-comentarios');
    if (!contenedor) return;

    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');
    const esAdmin = localStorage.getItem('user_role') === 'Admin' || localStorage.getItem('user_role') === 'Administrador';
    
    try {
        const res = await fetch('/api/resenas/' + idProducto);
        const comentariosReales = await res.json();

        if (comentariosReales.length === 0) {
            contenedor.innerHTML = '<p class="text-muted text-center my-4">No hay opiniones aún. ¡Sé el primero en comentar!</p>';
            return;
        }

        contenedor.innerHTML = comentariosReales.map(c => {
            const estrellasHtml = '★'.repeat(c.estrellas) + '☆'.repeat(5 - c.estrellas);
            
            // Reacciones seguras de la reseña principal
            const r1 = c.reacciones ? c.reacciones['👍'] || 0 : 0;
            const r_dis = c.reacciones ? c.reacciones['👎'] || 0 : 0; 
            const r2 = c.reacciones ? c.reacciones['❤️'] || 0 : 0;
            const r3 = c.reacciones ? c.reacciones['😮'] || 0 : 0;

            // RENDER LIMPIO: Respuestas del administrador
            let htmlRespuestas = '';
            if (c.respuestas && c.respuestas.length > 0) {
                htmlRespuestas = c.respuestas.map(resp => `
                    <div class="bg-light p-3 rounded ms-4 mt-2 border-start border-warning shadow-sm">
                        <div class="d-flex justify-content-between small fw-bold text-dark">
                            <span>👑 ${resp.nombre}</span>
                            <span class="text-muted small">${resp.fecha}</span>
                        </div>
                        <p class="mb-0 text-secondary small mt-1">${resp.texto}</p>
                    </div>
                `).join('');
            }

            const botonResponderAdmin = esAdmin ? `
                <button class="btn btn-link btn-sm text-dark p-0 text-decoration-none small" 
                        onclick="document.getElementById('form-resp-${c._id}').classList.toggle('d-none')">
                    <i class="bi bi-reply-all"></i> Responder
                </button>
            ` : '';
            
            return `
            <div class="border-bottom pb-3 mb-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold text-dark"><i class="bi bi-person-circle me-2 text-secondary"></i>${c.nombre}</span>
                    <span class="text-muted small">${c.fecha}</span>
                </div>
                <div class="text-warning mb-2" style="font-size: 1.1rem;">${estrellasHtml}</div>
                <p class="text-secondary mb-2 small">${c.texto}</p>

                <div class="d-flex align-items-center gap-2 mt-2">
                    <button class="btn btn-light btn-sm border rounded-pill py-0 px-2" style="font-size: 0.75rem;" onclick="enviarReaccion('${c._id}', '👍')">👍 <span id="count-👍-${c._id}">${r1}</span></button>
                    <button class="btn btn-light btn-sm border rounded-pill py-0 px-2" style="font-size: 0.75rem;" onclick="enviarReaccion('${c._id}', '👎')">👎 <span id="count-👎-${c._id}">${r_dis}</span></button>
                    <button class="btn btn-light btn-sm border rounded-pill py-0 px-2" style="font-size: 0.75rem;" onclick="enviarReaccion('${c._id}', '❤️')">❤️ <span id="count-❤️-${c._id}">${r2}</span></button>
                    <button class="btn btn-light btn-sm border rounded-pill py-0 px-2" style="font-size: 0.75rem;" onclick="enviarReaccion('${c._id}', '😮')">😮 <span id="count-😮-${c._id}">${r3}</span></button>
                    ${botonResponderAdmin}
                    
                    <button class="btn btn-link btn-sm text-primary p-0 text-decoration-none small ms-auto" onclick="compartirResena('${c._id}')">
                        <i class="bi bi-share"></i> 🔗 Compartir
                    </button>
                </div>

                <div id="respuestas-container-${c._id}">${htmlRespuestas}</div>

                <div id="form-resp-${c._id}" class="d-none mt-2 ms-4">
                    <div class="input-group input-group-sm">
                        <input type="text" 
                            id="input-resp-${c._id}" 
                            class="form-control" 
                            placeholder="Responder y presionar Enter..." 
                            onkeydown="if(event.key === 'Enter') enviarRespuestaAdmin('${c._id}')">
                            
                        <button class="btn btn-dark" onclick="enviarRespuestaAdmin('${c._id}')">Enviar</button>
                    </div>
                </div>
            </div>`;
        }).join('');

    } catch (error) {
        console.error("Error al cargar comentarios de MongoDB:", error);
        contenedor.innerHTML = '<p class="text-danger text-center my-4">No se pudieron cargar las opiniones.</p>';
    }
}

// Escuchador del formulario para nuevas opiniones
document.getElementById('form-comentario')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombreUsuario = localStorage.getItem('user_name');
    if (!nombreUsuario) {
        alert("Debes iniciar sesión para poder dejar un comentario.");
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const idProducto = urlParams.get('id');
    const texto = document.getElementById('comentario-texto').value;
    const starsInput = document.getElementById('comentario-estrellas');
    const estrellas = starsInput ? parseInt(starsInput.value) : 5;
    
    const nuevaResenaData = {
        id_producto: parseInt(idProducto),
        estrellas: estrellas,
        texto: texto,
        nombre: nombreUsuario 
    };

    try {
        const res = await fetch('/api/resenas', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('token')
            },
            body: JSON.stringify(nuevaResenaData)
        });

        if (res.ok) {
            document.getElementById('comentario-texto').value = '';
            await renderizarComentarios();
        } else {
            alert("No se pudo registrar la opinión en el servidor.");
        }
    } catch (error) {
        console.error("Error al enviar reseña a Mongo:", error);
    }
});

async function enviarReaccion(idResena, emoticon) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Debes iniciar sesión para reaccionar a las opiniones.");
        return;
    }

    try {
        const res = await fetch('/api/resenas/' + idResena + '/reaccionar', {
            method: 'PATCH',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ emoticon: emoticon })
        });

        if (res.ok) {
            // 🔥 SOLUCIÓN MAESTRA: Al recargar los comentarios en caliente, 
            // todos los contadores se actualizan con los datos reales de MongoDB de una sola vez.
            await renderizarComentarios();
        } else {
            console.error("El servidor Debian rechazó la actualización de la reacción.");
        }
    } catch (error) {
        console.error("Error de red al registrar la reacción dinámica:", error);
    }
}

async function enviarRespuestaAdmin(idResena) {
    const input = document.getElementById('input-resp-' + idResena);
    if (!input) return;

    const texto = input.value.trim();
    if (!texto) return;

    const token = localStorage.getItem('token');
    if (!token) {
        alert("Debes iniciar sesión para poder responder.");
        return;
    }

    try {
        const res = await fetch('/api/resenas/' + idResena + '/responder', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ texto: texto })
        });

        if (res.ok) {
            input.value = ''; 
            await renderizarComentarios();
        } else {
            const errorData = await res.json();
            alert("Error del servidor: " + (errorData.error || "No se pudo procesar la respuesta."));
        }
    } catch (error) {
        console.error("Error al responder:", error);
    }
}

// 🔥 NUEVA FUNCIÓN: Genera el link dinámico adaptado a localhost o AWS y lo copia
async function compartirResena(idResena) {
    try {
        // 1. Obtenemos el ID del producto actual desde la URL
        const urlParams = new URLSearchParams(window.location.search);
        const idProducto = urlParams.get('id');

        if (!idProducto) return;

        // 2. TRUCO DE AWS: Leemos el dominio actual (localhost o IP pública de AWS) en caliente
        const baseDomain = window.location.origin;

        // 3. Construimos el enlace apuntando al producto y usando un ancla (#) con el ID de Mongo
        const enlaceCompleto = baseDomain + '/detalle.html?id=' + idProducto + '#' + idResena;

        // 4. Guardamos el string directamente en el portapapeles del dispositivo
        await navigator.clipboard.writeText(enlaceCompleto);

        // 🔥 REEMPLAZO DEL ALERT FEO: Creamos una notificación flotante Premium en caliente
        const toastPersonalizado = document.createElement('div');
        
        // Estilos CSS modernos aplicados directamente
        Object.assign(toastPersonalizado.style, {
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            backgroundColor: '#198754', // Verde éxito de Bootstrap
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '9999',
            fontFamily: 'sans-serif',
            fontSize: '0.9rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            opacity: '0',
            transition: 'opacity 0.4s ease, transform 0.4s ease',
            transform: 'translateY(20px)' // 🔥 CORREGIDO: Mover en el eje Y de forma nativa
        });

        // Contenido con un icono limpio de Bootstrap Icons (si los usas)
        toastPersonalizado.innerHTML = `
            <i class="bi bi-check-circle-fill"></i> 
            <span>¡Enlace copiado al portapapeles con éxito!</span>
        `;

        // Lo inyectamos en la página
        document.body.appendChild(toastPersonalizado);

        // Efecto Fade-In (Aparecer suave)
        setTimeout(() => {
            toastPersonalizado.style.opacity = '1';
            toastPersonalizado.style.transform = 'translateY(0)';
        }, 50);

        // Efecto Fade-Out y destrucción automática a los 3 segundos
        setTimeout(() => {
            toastPersonalizado.style.opacity = '0';
            toastPersonalizado.style.transform = 'translateY(20px)';
            setTimeout(() => {
                toastPersonalizado.remove();
            }, 400); // Espera a que termine la animación para borrarlo del DOM por completo
        }, 3000);

    } catch (error) {
        console.error("Error al copiar el enlace:", error);
    }
}

renderizarComentarios();