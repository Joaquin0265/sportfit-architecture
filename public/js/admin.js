// 1. PROTEGER LA RUTA
(function() {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('user_role');
    if (!token || (rol !== 'Admin' && rol !== 'Administrador')) {
        window.location.href = '/login.html';
    }
})();

// 2. INICIALIZACIÓN
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();
    llenarSelectCategorias(); 
});

// --- FUNCIONES DE NAVEGACIÓN ---
// --- FUNCIONES DE NAVEGACIÓN ---
function mostrarSeccion(seccion) {
    // 1. Agregamos 'reportes' al array para que la función sepa que existe
    const secciones = ['productos', 'categorias', 'pedidos', 'reportes'];
    
    secciones.forEach(s => {
        const el = document.getElementById(`seccion-${s}`);
        if (el) el.style.display = 'none';
    });

    const seccionActiva = document.getElementById(`seccion-${seccion}`);
    if (seccionActiva) seccionActiva.style.display = 'block';

    // 2. Disparamos la carga de datos según la sección
    if (seccion === 'categorias') cargarCategorias();
    if (seccion === 'productos') cargarProductos();
    if (seccion === 'pedidos') cargarPedidos();
    if (seccion === 'reportes') cargarReportes(); // 🔥 NUEVO

    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.id === `link-${seccion}`) {
            link.classList.add('active');
        }
    });
}

// 🔥 NUEVA FUNCIÓN PARA LOS REPORTES
async function cargarReportes() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/dashboard-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();

        // 1. Actualizar tarjetas
        document.getElementById('metrica-pedidos').innerText = data.totalPedidos;
        document.getElementById('metrica-ingresos').innerText = `S/ ${data.ingresosTotales.toFixed(2)}`;
        document.getElementById('metrica-alertas').innerText = data.productosBajoStock.length;

        // 2. Llenar tabla de stock crítico
        const tabla = document.getElementById('tabla-stock-critico');
        tabla.innerHTML = data.productosBajoStock.map(p => `
            <tr>
                <td class="fw-bold">${p.nombre}</td>
                <td><span class="badge bg-danger">${p.stock} unidades</span></td>
                <td>${p.categoria}</td>
                <td>
                    <button class="btn btn-sm btn-dark" onclick="prepararEdicion(${p.id_producto})">Abastecer</button>
                </td>
            </tr>
        `).join('');

        if(data.productosBajoStock.length === 0) {
            tabla.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Todo el inventario está al día.</td></tr>';
        }

    } catch (error) {
        console.error("Error cargando reportes:", error);
    }
}

// --- LÓGICA DE PRODUCTOS ---
async function cargarProductos() {
    try {
        const res = await fetch('/api/productos', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const productos = await res.json();
        const tablaBody = document.getElementById('tabla-productos-body');
        if (!tablaBody) return;
        tablaBody.innerHTML = '';

        productos.forEach(p => {
            tablaBody.innerHTML += `
                <tr>
                    <td class="ps-4 text-muted">#${p.id_producto}</td>
                    <td class="fw-bold">${p.nombre}</td>
                    <td><strong>S/ ${p.precio}</strong></td>
                    <td><span class="badge bg-light text-dark">${p.stock} unid.</span></td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn btn-sm btn-outline-primary border-0" onclick="verProducto(${p.id_producto})">
                                <i class="bi bi-eye fs-5"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning border-0" onclick="prepararEdicion(${p.id_producto})">
                                <i class="bi bi-pencil-square fs-5"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarProducto(${p.id_producto})">
                                <i class="bi bi-trash3 fs-5"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        });
    } catch (error) { console.error("Error cargando productos:", error); }
}

// --- LÓGICA DE PEDIDOS ---
async function cargarPedidos() {
    try {
        const res = await fetch('/api/admin/pedidos', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const pedidos = await res.json();
        const tablaBody = document.getElementById('tabla-pedidos-body');
        if (!tablaBody) return;
        tablaBody.innerHTML = '';

        pedidos.forEach(p => {
            const fechaFormateada = p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString() : 'N/A';
            const estadoClase = p.estado === 'Pagado' ? 'bg-success' : 'bg-warning text-dark';
            
            tablaBody.innerHTML += `
                <tr>
                    <td class="ps-4">#${p.id_pedido}</td>
                    <td>${p.cliente}</td>
                    <td>${fechaFormateada}</td>
                    <td class="fw-bold">S/ ${p.total}</td>
                    <td class="text-center"><span class="badge ${estadoClase}">${p.estado}</span></td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn btn-sm btn-outline-primary border-0" onclick="verPedido(${p.id_pedido})">
                                <i class="bi bi-eye fs-5"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning border-0" onclick="editarPedido(${p.id_pedido})">
                                <i class="bi bi-pencil-square fs-5"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarPedido(${p.id_pedido})">
                                <i class="bi bi-trash3 fs-5"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        });
    } catch (error) { console.error("Error cargando pedidos:", error); }
}

async function cargarCategorias() {
    try {
        const res = await fetch('/api/admin/categorias', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const categorias = await res.json();
        const tablaBody = document.getElementById('tabla-categorias-body');
        if (!tablaBody) return;
        tablaBody.innerHTML = '';

        categorias.forEach(c => {
            tablaBody.innerHTML += `
                <tr>
                    <td class="ps-4">#${c.id_categoria}</td>
                    <td>${c.nombre}</td>
                    <td>${c.descripcion}</td>
                    <td class="text-center">
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn btn-sm btn-outline-primary border-0" onclick="verCategoria(${c.id_categoria})">
                                <i class="bi bi-eye fs-5"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning border-0" onclick="editarCategoria(${c.id_categoria})">
                                <i class="bi bi-pencil-square fs-5"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger border-0" onclick="eliminarCategoria(${c.id_categoria})">
                                <i class="bi bi-trash3 fs-5"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

async function llenarSelectCategorias() {
    try {
        const res = await fetch('/api/admin/categorias', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const categorias = await res.json();

        if (Array.isArray(categorias)) {
            const select = document.getElementById('p-categoria');
            if (select) {
                select.innerHTML = categorias.map(c => 
                    `<option value="${c.id_categoria}">${c.nombre}</option>`
                ).join('');
            }
        }
    } catch (e) { 
        console.error("Error en select:", e); 
    }
}

// --- VARIABLES GLOBALES ---
const modalProductoBS = new bootstrap.Modal(document.getElementById('modalProducto'));

// 1. FUNCIÓN PARA ABRIR EL MODAL (NUEVO PRODUCTO)
function abrirModalCrear() {
    document.getElementById('modalTitulo').innerText = "Nuevo Producto";
    document.getElementById('p-id').value = ""; 
    document.getElementById('form-producto').reset(); 
    llenarSelectCategorias(); 
    establecerEstadoFormulario(false);
    modalProductoBS.show();
}

// 2. EVENTO SUBMIT DEL FORMULARIO CON FORMDATA (ACTUALIZADO)
document.getElementById('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();

    const precio = parseFloat(document.getElementById('p-precio').value);
    const stock = parseInt(document.getElementById('p-stock').value);

    if (precio < 0.01) {
        alert("El precio debe ser al menos 0.01");
        return;
    }
    if (stock < 0) {
        alert("El stock no puede ser menor a 0");
        return;
    }

    const id = document.getElementById('p-id').value;
    const metodo = id ? 'PUT' : 'POST'; 
    const url = id ? `/api/productos/${id}` : `/api/productos`;

    // 🔥 USAMOS FORMDATA EN LUGAR DE JSON
    const formData = new FormData();
    formData.append('id_categoria', document.getElementById('p-categoria').value);
    formData.append('nombre', document.getElementById('p-nombre').value);
    formData.append('descripcion', document.getElementById('p-descripcion').value);
    formData.append('precio', precio);
    formData.append('stock', stock);

    // Capturamos el archivo físico
    const archivoImagen = document.getElementById('p-imagen').files[0];
    if (archivoImagen) {
        formData.append('imagen', archivoImagen);
    } else if (!id) {
        // Si es producto nuevo, exigimos la foto
        alert("Por favor, selecciona una imagen para el nuevo producto.");
        return;
    }

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: {
                // ⚠️ NO ENVIAR 'Content-Type' CUANDO SE USA FORMDATA
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (res.ok) {
            alert(id ? "Producto actualizado" : "Producto creado con éxito");
            modalProductoBS.hide();
            cargarProductos(); 
        } else {
            const err = await res.json();
            alert("Error: " + (err.mensaje || err.error || "No se pudo procesar"));
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        alert("Error de conexión con el servidor");
    }
});

async function eliminarProducto(id) {
    if (!confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.")) return;

    try {
        const res = await fetch(`/api/productos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (res.ok) {
            alert("Producto eliminado correctamente");
            cargarProductos(); 
        } else {
            const err = await res.json();
            alert("Error al eliminar: " + (err.mensaje || "Consulte al administrador"));
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión");
    }
}

// 2. Eliminar Categoría
async function eliminarCategoria(id) {
    if (!confirm("¿Deseas eliminar esta categoría? Si tiene productos asociados, podrían quedar sin categoría.")) return;

    try {
        const res = await fetch(`/api/admin/categorias/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (res.ok) {
            alert("Categoría eliminada");
            cargarCategorias();
            llenarSelectCategorias(); 
        } else {
            const err = await res.json();
            alert("Error: " + (err.mensaje || "No se puede eliminar una categoría en uso"));
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// 3. Eliminar Pedido
async function eliminarPedido(id) {
    if (!confirm("¿Eliminar registro de pedido # " + id + "?")) return;

    try {
        const res = await fetch(`/api/admin/pedidos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (res.ok) {
            alert("Pedido eliminado");
            cargarPedidos();
        } else {
            alert("No se pudo eliminar el pedido");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

async function verProducto(id) {
    try {
        const res = await fetch(`/api/productos/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const p = await res.json();

        document.getElementById('modalTitulo').innerText = "Consultar Producto";
        document.getElementById('p-nombre').value = p.nombre;
        document.getElementById('p-descripcion').value = p.descripcion;
        document.getElementById('p-precio').value = p.precio;
        document.getElementById('p-stock').value = p.stock;
        
        // ⚠️ Vaciamos el input file por seguridad del navegador
        document.getElementById('p-imagen').value = ""; 
        
        await llenarSelectCategorias();
        document.getElementById('p-categoria').value = p.id_categoria;

        establecerEstadoFormulario(true);
        modalProductoBS.show();
    } catch (error) {
        console.error("Error al ver producto:", error);
    }
}

async function prepararEdicion(id) {
    try {
        const res = await fetch(`/api/productos/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const p = await res.json();

        document.getElementById('modalTitulo').innerText = "Actualizar Producto";
        document.getElementById('p-id').value = p.id_producto; 
        document.getElementById('p-nombre').value = p.nombre;
        document.getElementById('p-descripcion').value = p.descripcion;
        document.getElementById('p-precio').value = p.precio;
        document.getElementById('p-stock').value = p.stock;
        
        // ⚠️ Vaciamos el input file
        document.getElementById('p-imagen').value = "";

        await llenarSelectCategorias();
        document.getElementById('p-categoria').value = p.id_categoria;

        establecerEstadoFormulario(false);
        modalProductoBS.show();
    } catch (error) {
        console.error("Error al preparar edición:", error);
    }
}

function establecerEstadoFormulario(soloLectura) {
    const campos = ['p-nombre', 'p-descripcion', 'p-precio', 'p-stock', 'p-categoria', 'p-imagen'];
    campos.forEach(id => {
        document.getElementById(id).disabled = soloLectura;
    });

    const btnGuardar = document.querySelector('#form-producto button[type="submit"]');
    btnGuardar.style.display = soloLectura ? 'none' : 'block';
    
    if (!soloLectura) {
        const id = document.getElementById('p-id').value;
        btnGuardar.innerText = id ? "Actualizar Producto" : "Guardar Producto";
    }
}

const modalCategoriaBS = new bootstrap.Modal(document.getElementById('modalCategoria'));
const URL_ADMIN_CAT = '/api/admin/categorias';

async function verCategoria(id) {
    try {
        const res = await fetch(`${URL_ADMIN_CAT}/${id}`, { 
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const c = await res.json();
        document.getElementById('modalTituloCat').innerText = "Consultar Categoría";
        document.getElementById('c-id').value = c.id_categoria;
        document.getElementById('c-nombre').value = c.nombre;
        document.getElementById('c-descripcion').value = c.descripcion;
        establecerEstadoCategoria(true); 
        modalCategoriaBS.show();
    } catch (e) { console.error("Error verCategoria:", e); }
}

async function editarCategoria(id) {
    try {
        const res = await fetch(`${URL_ADMIN_CAT}/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const c = await res.json();
        document.getElementById('modalTituloCat').innerText = "Actualizar Categoría";
        document.getElementById('c-id').value = c.id_categoria; 
        document.getElementById('c-nombre').value = c.nombre;
        document.getElementById('c-descripcion').value = c.descripcion;
        establecerEstadoCategoria(false); 
        modalCategoriaBS.show();
    } catch (e) { console.error("Error editarCategoria:", e); }
}

function abrirModalCategoria() {
    document.getElementById('modalTituloCat').innerText = "Nueva Categoría";
    document.getElementById('c-id').value = ""; 
    document.getElementById('form-categoria').reset();
    establecerEstadoCategoria(false);
    modalCategoriaBS.show();
}

function establecerEstadoCategoria(soloLectura) {
    document.getElementById('c-nombre').disabled = soloLectura;
    document.getElementById('c-descripcion').disabled = soloLectura;
    const btn = document.getElementById('btnGuardarCat');
    if(btn) btn.style.display = soloLectura ? 'none' : 'block';
}

document.getElementById('form-categoria').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('c-id').value;
    const datos = {
        nombre: document.getElementById('c-nombre').value.trim(),
        descripcion: document.getElementById('c-descripcion').value.trim()
    };

    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${URL_ADMIN_CAT}/${id}` : URL_ADMIN_CAT;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            alert(id ? "Actualizada con éxito" : "Creada con éxito");
            modalCategoriaBS.hide();
            cargarCategorias(); 
            llenarSelectCategorias(); 
        } else {
            const err = await res.json();
            alert("Error: " + err.error);
        }
    } catch (error) {
        alert("Error de conexión");
    }
});

const modalPedidoBS = new bootstrap.Modal(document.getElementById('modalPedido'));
const URL_PEDIDOS = '/api/admin/pedidos';

async function verPedido(id) {
    try {
        const res = await fetch(`${URL_PEDIDOS}/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const p = await res.json();

        document.getElementById('modalPedidoTitulo').innerText = `Detalle de Pedido #${p.id_pedido}`;
        document.getElementById('ped-id').value = p.id_pedido;
        document.getElementById('ped-estado').value = p.estado;
        
        if (p.fecha_pedido) {
            document.getElementById('ped-fecha').value = p.fecha_pedido.split('T')[0];
        }
        document.getElementById('ped-direccion').value = p.direccion_envio || '';
        
        document.getElementById('ped-estado').disabled = true;
        document.getElementById('ped-fecha').disabled = true;
        document.getElementById('ped-direccion').disabled = true;
        document.getElementById('btnGuardarPedido').style.display = 'none';
        document.getElementById('grupo-cliente').style.display = 'none'; 
        document.getElementById('seccion-productos-nuevo').style.display = 'none'; 

        const lista = document.getElementById('lista-productos-pedido');
        lista.innerHTML = p.detalles.map(d => `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                ${d.nombre} (x${d.cantidad})
                <span>S/ ${(d.precio_unitario * d.cantidad).toFixed(2)}</span>
            </li>
        `).join('');

        modalPedidoBS.show();
    } catch (error) { console.error(error); }
}

async function editarPedido(id) {
    try {
        const res = await fetch(`${URL_PEDIDOS}/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const p = await res.json();

        document.getElementById('modalPedidoTitulo').innerText = `Gestionar Pedido #${p.id_pedido}`;
        document.getElementById('ped-id').value = p.id_pedido;
        document.getElementById('ped-estado').value = p.estado;
        
        if (p.fecha_pedido) document.getElementById('ped-fecha').value = p.fecha_pedido.split('T')[0];
        document.getElementById('ped-direccion').value = p.direccion_envio;

        document.getElementById('ped-estado').disabled = false; 
        document.getElementById('ped-fecha').disabled = true;  
        document.getElementById('ped-direccion').disabled = true;
        
        document.getElementById('btnGuardarPedido').style.display = 'block';
        document.getElementById('grupo-cliente').style.display = 'none';
        document.getElementById('seccion-productos-nuevo').style.display = 'none';
        
        document.getElementById('lista-productos-pedido').innerHTML = '<p class="text-info small p-2">Modo edición: Solo se permite actualizar el estado del pedido.</p>';

        modalPedidoBS.show();
    } catch (error) { console.error(error); }
}

let productosSeleccionados = []; 

async function cargarSelectsPedido() {
    try {
        const token = localStorage.getItem('token');
        const resCli = await fetch('/api/admin/usuarios', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const usuarios = await resCli.json();
        const selCli = document.getElementById('ped-cliente');
        selCli.innerHTML = usuarios.map(u => `<option value="${u.id_usuario}">${u.nombre}</option>`).join('');

        const resProd = await fetch('/api/productos', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const productos = await resProd.json();
        const selProd = document.getElementById('sel-producto');
        selProd.innerHTML = productos.map(p => `<option value="${p.id_producto}" data-precio="${p.precio}" data-nombre="${p.nombre}">${p.nombre} - S/ ${p.precio}</option>`).join('');
    } catch (e) { console.error("Error cargando selects:", e); }
}

function agregarProductoALista() {
    const sel = document.getElementById('sel-producto');
    const opt = sel.options[sel.selectedIndex];
    const id_producto = sel.value;
    const nombre = opt.getAttribute('data-nombre');
    const precio = parseFloat(opt.getAttribute('data-precio'));
    const cantidad = parseInt(document.getElementById('sel-cantidad').value);

    if (cantidad <= 0) return alert("Cantidad inválida");

    productosSeleccionados.push({ id_producto, nombre, precio, cantidad });
    renderizarListaTemporal();
}

function renderizarListaTemporal() {
    const lista = document.getElementById('lista-productos-pedido');
    if (!lista) return;

    lista.innerHTML = productosSeleccionados.map((p, index) => `
        <li class="list-group-item d-flex justify-content-between align-items-center py-2">
            <div class="d-flex align-items-center">
                <i class="bi bi-box-seam text-secondary me-2"></i>
                <div>
                    <span class="fw-bold small d-block">${p.nombre}</span>
                    <small class="text-muted">Cant: ${p.cantidad} x S/ ${p.precio}</small>
                </div>
            </div>
            <div class="d-flex align-items-center gap-3">
                <span class="fw-bold text-primary">S/ ${(p.precio * p.cantidad).toFixed(2)}</span>
                
                <button type="button" 
                        class="btn btn-outline-danger btn-sm border-0" 
                        onclick="quitarProducto(${index})"
                        title="Quitar de la lista">
                    <i class="bi bi-trash3-fill fs-5"></i> 
                </button>
            </div>
        </li>
    `).join('');
}

function quitarProducto(index) {
    productosSeleccionados.splice(index, 1);
    renderizarListaTemporal();
}

function abrirModalPedido() {
    const form = document.getElementById('form-pedido');
    form.reset();
    document.getElementById('modalPedidoTitulo').innerText = "Nuevo Pedido Manual";
    document.getElementById('ped-id').value = ""; 
    
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('ped-fecha').value = hoy;
    
    document.getElementById('ped-estado').disabled = false;
    document.getElementById('ped-fecha').disabled = false;
    document.getElementById('ped-direccion').disabled = false;
    document.getElementById('btnGuardarPedido').style.display = 'block';
    document.getElementById('grupo-cliente').style.display = 'block';
    document.getElementById('seccion-productos-nuevo').style.display = 'block';
    
    productosSeleccionados = [];
    renderizarListaTemporal();
    cargarSelectsPedido();
    modalPedidoBS.show();
}

document.getElementById('form-pedido').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_pedido = document.getElementById('ped-id').value;
    const token = localStorage.getItem('token');

    let url = '/api/admin/pedidos';
    let metodo = 'POST';
    let body = {};

    if (id_pedido) {
        metodo = 'PUT';
        url += `/${id_pedido}`;
        body = { estado: document.getElementById('ped-estado').value };
    } else {
        if (productosSeleccionados.length === 0) {
            alert("Debes añadir al menos un producto.");
            return;
        }

        body = {
            id_usuario: document.getElementById('ped-cliente').value,
            direccion_envio: document.getElementById('ped-direccion').value || "Recojo en tienda",
            fecha: document.getElementById('ped-fecha').value,
            estado: document.getElementById('ped-estado').value,
            productos: productosSeleccionados 
        };
    }

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (res.ok) {
            alert(id_pedido ? "Estado actualizado" : "Pedido creado correctamente");
            modalPedidoBS.hide();
            cargarPedidos(); 
        } else {
            alert("Error: " + (data.error || data.mensaje));
        }
    } catch (error) {
        console.error("Error en submit pedido:", error);
        alert("Error de conexión con el servidor");
    }
});