var reservasGlobales = []
var _audioPersonalizado = null;
var _musicaReproduciendo = false;
var actividadesGlobales = [];

function cargarInformacion(){
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    reservasGlobales = JSON.parse(localStorage.getItem("reservas"));
    console.log("Usuario: ",usuario)
    console.log("Reservas: ",reservasGlobales)
    if (usuario && reservasGlobales){
        renderReservations(reservasGlobales);
        renderComplementos(reservasGlobales[reservasGlobales.length - 1].idReserva);
        $("#botonCerrarSession").show()
        selectPestana('home')
        quitarFooter()
        $("#tituloPrincipal").html("¡HOLA " + usuario.nombres.toUpperCase() + " " + usuario.apellidos.toUpperCase() + "!");
        // === LOG DEBUG personalizacion ===
        console.log("[DEBUG] reservasGlobales completo:", JSON.parse(JSON.stringify(reservasGlobales)));
        reservasGlobales.forEach(function(r, i){
            console.log("[DEBUG] reserva[" + i + "] idReserva=" + r.idReserva + " | personalizacion=", r.personalizacion);
        });
        // Mostrar modal de bienvenida personalizada si alguna reserva tiene datos
        var personalizacionData = reservasGlobales.find(function(r){
            return r.personalizacion && (r.personalizacion.imagen1 || r.personalizacion.imagen2 || r.personalizacion.logo || r.personalizacion.musica);
        });
        console.log("[DEBUG] personalizacionData encontrado:", personalizacionData ? personalizacionData.personalizacion : "NINGUNO");
        if (personalizacionData) {
            mostrarModalBienvenida(usuario.nombres, personalizacionData.personalizacion);
        }
    }
    else{
        sinSession()
    }
    
}


function quitarFooter(){
    $("#pie_documentos").hide()
    $("#pie_tickets").hide()
    $("#pie_hotel").hide()
    $("#pie_sim").hide()
    $("#pie_boarding").hide()
    $("#pie_seguro").hide()
    $("#pie_otro").hide()
}



function selectPestana(id,idReserva){
    if(id == "home"){
        $("#btnHome").hide()
        $("#pestana_home").show()
        $("#pestana_reserva").hide()
        $("#footer_home").hide()
    }
    else{
        $("#btnHome").show()
        construirDOMPDFS(idReserva)
        selectSubPestana('documentos')
        $("#pestana_home").hide()
        $("#pestana_reserva").show()
        $("#footer_home").show()
    }
    scrollTop()
    $("#pestana_"+id).show()
}




function selectSubPestana(id){
    if(id == 'home' || id == 'actividades'){
        $("#pdfViewer").hide()
    }
    else{
        $("#pdfViewer").show()
    }
    document.querySelectorAll("[id^='lista']").forEach(el => {
        el.style.display = "none";
    });
    scrollTop();
    $("#lista_" + id).show();
    console.log("Mostrando subpestaña: ", pdfsGlobales[id]);

    // Resaltar el item del footer que se presionó y quitar el resaltado a los demás
    try{
        document.querySelectorAll('.footer-item').forEach(el => el.classList.remove('active'));
        const footerItem = document.querySelector(`#pie_${id} .footer-item`);
        if(footerItem) footerItem.classList.add('active');
    }catch(e){ console.warn('Error actualizando estado activo del footer', e); }

    // Timeline para actividades — muestra itinerario, no el carrusel de PDFs
    if(id === 'actividades'){ renderTimeline(); return; }

    // <div class="pdf-footer">
    //                 <a href="#" class="btn btn-sm btn-primary" onclick="descargarDocumento('${doc.ruta}'); return false;">Descargar</a>
    //             </div>

    var $carousel = $('#carousel-pdfs');
    $carousel.empty();
    (pdfsGlobales[id]||[]).forEach((doc,index) => {
        var item = `
            
            <div class="pdf-item" style="position:relative;">
            <a href="#" data-documento='${JSON.stringify(doc)}' onclick="abrirModalPdfFullscreen(this); return false;" aria-label="Ver PDF en pantalla completa" style="position:absolute;top:25px;left:10px;display:inline-flex;align-items:center;gap:6px;padding:7px 13px;border-radius:24px;background:linear-gradient(135deg,#007bff,#0056d6);color:#fff;text-decoration:none;box-shadow:0 4px 14px rgba(0,100,255,0.45);z-index:10;font-size:12px;font-weight:700;letter-spacing:.4px;white-space:nowrap;transition:transform .15s,box-shadow .15s;" onmouseover="this.style.transform='scale(1.06)';this.style.boxShadow='0 6px 18px rgba(0,100,255,0.55)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 14px rgba(0,100,255,0.45)'">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0;"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                Ver PDF
            </a>

            <div class="pdf-title" style="font-weight:600;font-size:8px;text-align:center;margin-bottom:8px;">
                ${doc.titulo ? doc.titulo : ''}
            </div>
            <div class="pdf-frame" style="width:100%;height:400px;overflow:hidden;">
                <object data="${doc.url}" type="application/pdf" width="100%" height="100%">
                <p>Tu navegador no soporta PDFs. <a href="${doc.url}">Descargar PDF</a></p>
                </object>
            </div>
            
            </div> 
            
        `;
        $carousel.append(item);
    });
    // posicionar al inicio para que se vea el primer item y parte del siguiente (1.5)
    setTimeout(function(){
        $carousel.scrollLeft(0);
    },60);

    // Actualizar indicador de páginas (si la función está disponible)
    try{ if(typeof setupPdfIndicators === 'function') setupPdfIndicators(); }catch(e){console.warn('setupPdfIndicators no disponible', e)};
}







function abrirModalPdfFullscreen(el){
    if(!el) return;
    mostrarSpinnerPdf();
    document.getElementById('pdfHintMsg').style.display = 'none';
    el._pdfRetries = el._pdfRetries ?? 0;

    if(el._pdfRetries >= 3){
        console.error('❌ PDF no cargó tras 3 intentos');
        document.getElementById('pdfHintMsg').style.display = 'flex';
        return;
    }

    const raw = el.dataset?.documento;
    if(!raw) return console.warn('No dataset.documento encontrado');

    let doc;
    try { doc = JSON.parse(raw); }
    catch(e){ return console.error('Error parseando dataset.documento:', e); }

    if(!doc.url) return console.warn('doc.url no existe');

    const viewerUrl = 'https://docs.google.com/gview?embedded=true&url=' + encodeURIComponent(doc.url);

    const container = document.getElementById('contenidoModalPdf');
    const controls = document.getElementById('pdfControls');
    controls.style.top = '72px'; 
    if(!container || !controls) return;

    /* limpiar */
    container.innerHTML = '';
    controls.innerHTML = '';

    /* iframe */
    const iframe = document.createElement('iframe');
    iframe.src = viewerUrl;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = '0';

    let iframeLoaded = false;
    const startTime = Date.now();

    iframe.onload = () => {
        iframeLoaded = true;
        el._pdfRetries = 0;

        ocultarSpinnerPdf();
        console.log('✅ PDF iframe cargado correctamente');
        console.log('⏱ Tiempo de carga:', Date.now() - startTime, 'ms');
    };

    iframe.onerror = () => {
        console.error('❌ Error cargando el iframe PDF');
    };


    setTimeout(() => {
        if (!iframeLoaded) {
            el._pdfRetries++;
            console.warn('🔁 Reintentando carga PDF', el._pdfRetries);
            abrirModalPdfFullscreen(el);
        }
    }, 2500);

    container.appendChild(iframe);

    /* botones */
    const makeBtn = (icon, title, fn, bg='#007bff')=>{
        const b = document.createElement('button');
        b.type = 'button';
        b.title = title;
        b.style.width = '44px';
        b.style.height = '44px';
        b.style.borderRadius = '50%';
        b.style.border = '0';
        b.style.background = bg;
        b.style.color = '#fff';
        b.style.display = 'flex';
        b.style.alignItems = 'center';
        b.style.justifyContent = 'center';
        b.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
        b.style.fontSize = '22px';
        b.innerHTML = icon;
        b.onclick = fn;
        return b;
    };

    controls.appendChild(makeBtn(
        '<i class="mdi mdi-download"></i>',
        'Descargar',
        ()=>{ doc.ruta ? descargarDocumento(doc.ruta) : window.open(doc.url,'_blank'); }
    ));

    controls.appendChild(makeBtn(
        '<i class="mdi mdi-refresh"></i>',
        'Recargar',
        ()=>{ abrirModalPdfFullscreen(el); }
    ));

    controls.appendChild(makeBtn(
        '<i class="mdi mdi-close"></i>',
        'Cerrar',
        ()=>{ $('#modalPdfBootstrap').modal('hide'); },
        '#dc3545'
    ));

    /* abrir modal */
    $('#modalPdfBootstrap').modal({
        backdrop: 'static',
        keyboard: true
    }).modal('show');
}




const mostrarSpinnerPdf = () => {
    const s = document.getElementById('pdfSpinner');
    if(s) s.style.display = 'flex';
};

const ocultarSpinnerPdf = () => {
    const s = document.getElementById('pdfSpinner');
    if(s) s.style.display = 'none';
};






var pdfsGlobales = {tickets: [], hotel: [], documentos: [], boarding: [], sim: [], seguro: [], otro: []}

function construirDOMPDFS(idReserva){
    pdfsGlobales = {tickets: [], hotel: [], documentos: [], boarding: [], sim: [], seguro: [], otro: []}
    let element = Array.isArray(reservasGlobales) ? reservasGlobales.slice() : [];
    if (typeof idReserva !== 'undefined' && idReserva !== null && idReserva !== '') {
        element = element.filter(r => String(r.idReserva) === String(idReserva));
    }
    console.log("Reserva seleccionada para PDFs: ", element);
    if(element.length === 0) return;
    element = element[0]; // tomar el primero si hay varios


    //OBTENER SI TENGO BILLETERA CONJUNTA
    const currentUser = (typeof usuario !== 'undefined' && usuario) ? usuario : (JSON.parse(localStorage.getItem('usuario')||'{}'));
    const viajeroEncontrado = Array.isArray(element.viajeros) ? element.viajeros.find(v => String(v.idViajero) === String(currentUser.idViajero)) : null;
    const billeteraConjuntaUsuario = Boolean(viajeroEncontrado && Number(viajeroEncontrado.billeteraConjunta) === 1);
    console.log("Billetera conjunta usuario:", billeteraConjuntaUsuario);
    

    // DOCUMENTOS PERSONALES
    if(element.viajeros.length>0){
        element.viajeros.forEach(personal => {
            if(billeteraConjuntaUsuario){
                personal.docs.forEach(doc => {
                    let tituloPersonal = `${doc.tipoDocumento} - ${personal.nombres} ${personal.apellidos}`;
                    pdfsGlobales.documentos.push({
                        url: doc.urlFirmada,
                        ruta: doc.ruta,
                        titulo: tituloPersonal,
                        imagen: "img/portadas/personales.jpg"
                    })
                });
            }
            else{
                if(Number(personal.idViajero) === Number(usuario.idViajero)){
                    personal.docs.forEach(doc => {
                        let tituloPersonal = `${doc.tipoDocumento} - ${personal.nombres} ${personal.apellidos}`;
                        pdfsGlobales.documentos.push({
                            url: doc.urlFirmada,
                            ruta: doc.ruta,
                            titulo: tituloPersonal,
                            imagen: "img/portadas/personales.jpg"
                        })
                    });
                } 
            }
                           
        });
        $("#pie_documentos").show()
    }
    else{
        $("#pie_documentos").hide()
    }




    // RESERVAS
    if(element.urlFirmadaReservaCompleta){
        const info = {
            url: element.urlFirmadaReservaCompleta,
            ruta: element.rutaReservaCompleta,
            titulo: "Reserva",
            imagen: "img/portadas/reserva.jpg"
        }
        pdfsGlobales.hotel.push(info);
        $("#pie_hotel").show()
    }
    else{
        $("#pie_hotel").hide()
    }
    


    // TICKETS
    if(element.tickets.length>0){
        element.tickets.forEach(tkts => {
            if(billeteraConjuntaUsuario){
                const tramo = tkts.tramos.map(item => `${item.codigoCiudadSalida}➡️${item.codigoCiudadDestino}`).join(", ")
                const personas = tkts.viajeros.map(item => `${item.nombres} ${item.apellidos}`).join(", ")
                const tituloTkt = `${tramo} - ${personas}`;
                pdfsGlobales.tickets.push({
                    url: tkts.urlFirmada,
                    ruta: tkts.ruta,
                    titulo: tituloTkt,
                    imagen: "img/portadas/tickets.jpg"
                })
            }
            else{
                const existe = tkts.viajeros.find(item => (Number(item.idViajero) === Number(usuario.idViajero)));
                if(existe){
                    const tramo = tkts.tramos.map(item => `${item.codigoCiudadSalida}➡️${item.codigoCiudadDestino}`).join(", ")
                    const tituloTkt = `${tramo} - ${existe.nombres} ${existe.apellidos}`;
                    pdfsGlobales.tickets.push({
                        url: tkts.urlFirmada,
                        ruta: tkts.ruta,
                        titulo: tituloTkt,
                        imagen: "img/portadas/tickets.jpg"
                    })
                }
            }
            
            
        });
        $("#pie_tickets").show()
    }
    else{
        $("#pie_tickets").hide()
    }


    




    // EXTRAS — categoría determinada por el TIPO DE SERVICIO del extra (texto),
    // no por el idTipoDocumento del archivo (que puede ser factura=19 u otro)
    var BILLING_TIPOS = [15, 16, 17, 18, 19];
    function _pushExtra(documento, doc) {
        if (!doc.urlFirmada) return;
        // Ignorar documentos de facturación interna
        if (BILLING_TIPOS.indexOf(Number(doc.idTipoDocumento)) >= 0) return;
        var tipoTexto = (documento.tipoDocumento || '').toLowerCase();
        var nombres   = documento.nombres + ' ' + documento.apellidos;
        if (tipoTexto.indexOf('sim') >= 0) {
            $("#pie_sim").show();
            pdfsGlobales.sim.push({ url: doc.urlFirmada, ruta: doc.ruta, titulo: '📲 SIM - ' + nombres, imagen: 'img/portadas/sim.jpg' });
        } else if (tipoTexto.indexOf('board') >= 0) {
            $("#pie_boarding").show();
            pdfsGlobales.boarding.push({ url: doc.urlFirmada, ruta: doc.ruta, titulo: '📄 Boarding Pass - ' + nombres, imagen: 'img/portadas/boarding.jpg' });
        } else if (tipoTexto.indexOf('seguro') >= 0 || tipoTexto.indexOf('insurance') >= 0) {
            $("#pie_seguro").show();
            pdfsGlobales.seguro.push({ url: doc.urlFirmada, ruta: doc.ruta, titulo: '🔒 Seguro de viajes - ' + nombres, imagen: 'img/portadas/seguro.jpg' });
        } else {
            $("#pie_otro").show();
            pdfsGlobales.otro.push({ url: doc.urlFirmada, ruta: doc.ruta, titulo: '📄 Documento Adicional - ' + nombres, imagen: 'img/portadas/extras.jpg' });
        }
    }

    if(element.documentos.length>0){
        element.documentos.forEach(documento => {
            if(Number(documento.mostrarTrip) == 1){
                if(billeteraConjuntaUsuario){
                    documento.docs.forEach(doc => { _pushExtra(documento, doc); });
                }
                else{
                    if(Number(documento.idViajero) === Number(usuario.idViajero)){
                        documento.docs.forEach(doc => { _pushExtra(documento, doc); });
                    }
                }
            }
            
        });
        
    }

    // ACTIVIDADES
    actividadesGlobales = [];
    if(Array.isArray(element.actividades) && element.actividades.length > 0){
        actividadesGlobales = element.actividades.slice().sort(function(a, b){
            return new Date((a.fechaInicio||'').replace(' ','T')) - new Date((b.fechaInicio||'').replace(' ','T'));
        });
        $("#pie_actividades").show();
    } else {
        $("#pie_actividades").hide();
    }

}




function descargarDocumento(ruta) {
    const rutaAux = encodeURIComponent(ruta);
    Obtener_API_Trip(null, '/descargarDocumento?ruta=' + rutaAux, datos => {
      if (datos?.estado) {
        window.open(datos.linkDescarga, '_blank');
      } else {
        mensajeUsuario('info','Oops', datos.mensaje)
      }
  });
}






function formatDate(dateString){
    if(!dateString) return '';
    // soporta formatos "YYYY-MM-DD HH:MM:SS"
    const d = new Date(dateString.replace(' ', 'T'));
    if(isNaN(d)) return dateString;
    return d.toLocaleDateString(undefined,{ day: '2-digit', month: 'short', year: 'numeric' });
}



function renderReservations(reservas) {
    console.log('Renderizando reservas:', reservas);
    const container = document.getElementById('reservas_list');
    if (!container) return;

    let list = Array.isArray(reservas) ? reservas : (JSON.parse(localStorage.getItem('reservas') || '[]') || []);

    if (list.length === 0) {
        container.innerHTML = `<div style="padding:20px;border-radius:10px;background:#fff;border:1px dashed #eee;color:#666">No hay reservas disponibles</div>`;
        return;
    }

    let lista = ""
    reservas.forEach((element) => {
        const destinos = Array.isArray(element.destinos) ? element.destinos : (Array.isArray(element.destino) ? element.destino : []);
        const idReserva = element.idReserva || element.id || '';

        // concatenar ciudades
        const ciudadesConcat = destinos.map(d => d.ciudad || '').filter(Boolean).join(' - ');

        // obtener fecha más temprana y su urlImagen
        let primeraFecha = '';
        let imagenPrimera = '';
        if (destinos.length > 0) {
            const mapped = destinos.map(d => ({
                orig: d,
                date: new Date(String(d.fechaViaje || '').replace(' ', 'T'))
            }));
            const valid = mapped.filter(m => !isNaN(m.date));
            const earliest = valid.length ? valid.reduce((a, b) => a.date <= b.date ? a : b).orig : mapped[0].orig;
            primeraFecha = earliest && earliest.fechaViaje ? formatDate(earliest.fechaViaje) : '';
            imagenPrimera = earliest && earliest.urlImagen ? earliest.urlImagen : '';
        }

        // objeto usado en el template
        const it = {
            id: idReserva,
            title: ciudadesConcat || 'Sin destino',
            img: imagenPrimera || 'img/headers/avion.jpg',
            desc: primeraFecha || ''
        };
        lista += `
            <div class="comp-card" role="button" tabindex="0" onclick='showReservaId(${JSON.stringify(destinos)})'>
                <img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.title)}">
                <div class="comp-body">
                    <div class="comp-title">${escapeHtml(it.title)}</div>
                    <div class="comp-desc">${escapeHtml(it.desc)}</div>
                </div>
            </div>
        `
    });
    container.innerHTML = lista
}



function escapeHtml(str){
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}



function showReservaId(destinosArray) {
    console.log('Mostrando detalles para destinos:', destinosArray);
    // Si recibe un string JSON, decodifica
    let destinos = destinosArray;
    if (typeof destinosArray === 'string') {
        try {
            destinos = JSON.parse(destinosArray);
        } catch (e) {
            console.error('No se pudo decodificar destinos:', destinosArray);
            destinos = [];
        }
    }
    if (destinos.length > 0 && destinos[0].urlImagen) {
        document.querySelector('[data-hero="reserva"]').style.backgroundImage = `url('${destinos[0].urlImagen}')`;
    }
    $("#tituloDestino").html(destinos.map(d => d.ciudad).filter(Boolean).join(' - '))
    selectPestana('reserva', destinos[0]?.idReserva);
}


// Complementos carousel
function renderComplementos(idReserva){
    const reservasServicios = [
        {
            idReserva: 364,
            servicios: [0]
        }
    ]
    const container = document.getElementById('complementos_carousel');
    if(!container) return;

    const defaults = [
        { id: 'esim', title: 'eSIM', desc: 'Mantente conectado', img: 'https://i.insider.com/608c561d35c46f0018c0bb1c?width=1200&format=jpeg' },
        { id: 'seguro', title: 'Seguro de Viaje', desc: 'Protección durante el viaje', img: 'https://drakarelia.ec/mt-content/uploads/2024/01/seguros-medicos-1024x679.webp' },
        { id: 'actividades', title: 'Actividades', desc: 'Tours y experiencias', img: 'https://thumbs.dreamstime.com/b/elegante-experiencia-gastron%C3%B3mica-de-negocios-chef-profesional-que-prepara-comida-gourmet-en-una-estaci%C3%B3n-personal-con-vidrios-y-391222890.jpg' },
        { id: 'vip', title: 'Salas Vip', desc: 'Comodidad y Exclusividad', img: 'https://aeronotas.com/wp-content/uploads/2022/09/Salon-Admirals-Club-de-AA.jpg' },
        { id: 'dias_extra', title: 'Días Extra', desc: 'Extiende tu estadía', img: 'https://www.clarin.com/img/2021/06/11/o3BCiMjVA_1256x620__1.jpg' },
        { id: 'migratoria', title: 'Orientación Migratoria', desc: 'Acompañamos tu proceso de visa', img: 'https://imagenes.primicias.ec/files/image_480_270/uploads/2025/08/22/68a8a5691c2f2.jpeg'},
        { id: 'fast', title: 'Fast Track', desc: 'Evita Filas y ahorra tiempo', img: 'https://res.klook.com/images/fl_lossy.progressive,q_65/c_fill,w_1295,h_971/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/k40dij9mmfu2c66b1lab/ServicioVIPdelAeropuertoInternacionaldeHangzhouXiaoshan.jpg'},
        { id: 'traslados', title: 'Traslados', desc: 'Aereopuerto ↔️ Hotel', img: 'https://media.tacdn.com/media/attractions-splice-spp-360x240/06/71/93/51.jpg'},
    ];

    const reservaServicioConfig = reservasServicios.find(r => String(r.idReserva) === String(idReserva));
    const list = reservaServicioConfig
        ? reservaServicioConfig.servicios.map(i => defaults[i]).filter(Boolean)
        : defaults;

    container.innerHTML = list.map(it => `
        <div class="comp-card" role="button" tabindex="0" onclick="abrirChatWhatsApp('Hola equipo de reservas de Marketing Vip, quisiera adquerir el servicio complmentario de ${escapeHtml(String(it.title))} para mi reserva. Mi ID de reserva es: ${idReserva}')" onkeydown="if(event.key==='Enter') onComplementoClick('${escapeHtml(String(it.id))}')">
            <img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.title)}">
            <div class="comp-body">
                <div class="comp-title">${escapeHtml(it.title)}</div>
                <div class="comp-desc">${escapeHtml(it.desc)}</div>
            </div>
        </div>
    `).join('');
}


function abrirModalPdfs(){
    console.log("Abriendo modal de PDFs");
    $('#pdfModal').modal('show');
}




// --- PDF indicator setup: reusable, callable after dynamic inserts ---
var pdfIndicatorState = { io: null, mo: null };

function setupPdfIndicators(){
    const container = document.getElementById('carousel-pdfs');
    const currentEl = () => document.getElementById('pdfCurrent');
    const totalEl = () => document.getElementById('pdfTotal');
    const dotsWrap = () => document.getElementById('pdfDots');

    if(!container) return;

    function setupObservers(items){
        if(pdfIndicatorState.io){ try{ pdfIndicatorState.io.disconnect(); }catch(e){} }
        dotsWrap().innerHTML = '';
        items.forEach((_, i) => {
            const d = document.createElement('div');
            d.className = 'pdf-dot';
            d.setAttribute('role','tab');
            d.setAttribute('aria-label', `Página ${i+1}`);
            d.dataset.index = i;
            d.addEventListener('click', () => {
                const item = items[i];
                item.scrollIntoView({behavior:'smooth', inline:'start'});
            });
            dotsWrap().appendChild(d);
        });

        totalEl().textContent = items.length || 0;
        if(items.length === 0){
            currentEl().textContent = 0;
            return;
        }

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if(entry.isIntersecting && entry.intersectionRatio > 0.45){
                    const idx = Array.prototype.indexOf.call(items, entry.target);
                    currentEl().textContent = idx + 1;
                    const ds = dotsWrap().children;
                    for(let i=0;i<ds.length;i++){
                        ds[i].classList.toggle('active', i===idx);
                    }
                }
            });
        }, { root: container, threshold: [0.45, 0.6] });

        items.forEach(it => io.observe(it));
        pdfIndicatorState.io = io;

        requestAnimationFrame(() => {
            const first = items[0];
            if(first){
                currentEl().textContent = 1;
                dotsWrap().children[0]?.classList.add('active');
            }
        });
    }

    // Recreate MutationObserver so future changes re-trigger observer setup
    if(pdfIndicatorState.mo){ try{ pdfIndicatorState.mo.disconnect(); }catch(e){} }
    const mo = new MutationObserver(() => {
        const items = container.querySelectorAll('.pdf-item');
        if(items.length){
            setupObservers(items);
        } else {
            totalEl().textContent = 0;
            currentEl().textContent = 0;
            dotsWrap().innerHTML = '';
            if(pdfIndicatorState.io){ try{ pdfIndicatorState.io.disconnect(); }catch(e){} pdfIndicatorState.io = null; }
        }
    });
    pdfIndicatorState.mo = mo;
    mo.observe(container, { childList: true, subtree: true });

    const initialItems = container.querySelectorAll('.pdf-item');
    if(initialItems.length) setupObservers(initialItems);
}

// Inicializar en carga
try{ setupPdfIndicators(); }catch(e){console.warn('Error inicializando indicadores PDF', e)}

// ── Personalización ──────────────────────────────────────────────────────────
function mostrarModalBienvenida(nombre, p) {
    // Saludo
    $('#modalNombreBienvenida').text('¡Hola, ' + nombre + '! 🌟');

    // Logo personalizado — modal y header
    if (p.logo) {
        $('#modalLogoPersonalizado').attr('src', p.logo).show();
        // Logo en header del index
        var headerLogo = document.getElementById('logoPersonalizadoHeader');
        if (headerLogo) {
            headerLogo.src = p.logo;
            headerLogo.style.display = 'block';
            setTimeout(function(){ headerLogo.style.opacity = '1'; }, 50);
        }
    }

    // Imágenes — imagen1 como fondo del modal, imagen2 en la fila del botón
    var bgUrl = p.imagen1 || p.imagen2 || '';
    if (bgUrl) {
        $('#modalBgImagen').css('background-image', 'url(' + bgUrl + ')');
    }
    if (p.imagen1) { $('#modalImagen1').attr('src', p.imagen1); }
    if (p.imagen2) { $('#modalImagen2').attr('src', p.imagen2); $('#modalImagen2Thumb').attr('src', p.imagen2).show(); }

    // Descripción del viaje
    if (p.descripcion) {
        $('#modalDescripcionTexto').text(p.descripcion);
        $('#modalDescripcionViaje').show();
    } else {
        $('#modalDescripcionViaje').hide();
    }

    // Música — asignar fuente y mostrar botón FAB
    if (p.musica) {
        var audio = document.getElementById('audioPersonalizado');
        audio.src = p.musica;
        _audioPersonalizado = audio;
        $('#btnMusicaFab').show();
    }

    // Al cerrar el modal el usuario YA interactuó → el navegador permite el play
    $('#modalBienvenida').off('hidden.bs.modal.musica').on('hidden.bs.modal.musica', function(){
        if (_audioPersonalizado && !_musicaReproduciendo) {
            _audioPersonalizado.play().then(function(){
                _musicaReproduciendo = true;
                actualizarBotonMusica();
            }).catch(function(e){
                console.warn('[Música] No se pudo reproducir:', e);
            });
        }
    });

    setTimeout(function(){
        $('#modalBienvenida').modal('show');

        // Intento de autoplay inmediato (puede ser bloqueado por políticas del navegador;
        // si falla, la música arrancará cuando el usuario cierre el modal)
        if (_audioPersonalizado) {
            _audioPersonalizado.play().then(function(){
                _musicaReproduciendo = true;
                actualizarBotonMusica();
            }).catch(function(){
                console.log('[Música] Autoplay bloqueado; se reproducirá al cerrar el modal.');
            });
        }
    }, 800);
}

function toggleMusica() {
    if (!_audioPersonalizado) return;
    if (_musicaReproduciendo) {
        _audioPersonalizado.pause();
        _musicaReproduciendo = false;
    } else {
        _audioPersonalizado.play().catch(function(){});
        _musicaReproduciendo = true;
    }
    actualizarBotonMusica();
}

function actualizarBotonMusica() {
    var iconEl = document.getElementById('iconMusica');
    if (!iconEl) return;
    if (_musicaReproduciendo) {
        // ícono pausa
        iconEl.innerHTML = '<path fill="currentColor" d="M6 19h4V5H6zm8-14v14h4V5z"/>';
        document.getElementById('btnMusicaFab').title = 'Pausar música';
    } else {
        // ícono play
        iconEl.innerHTML = '<path fill="currentColor" d="M8 5v14l11-7z"/>';
        document.getElementById('btnMusicaFab').title = 'Reproducir música';
    }
}


// ── Timeline de actividades ───────────────────────────────────────────────────
function renderTimeline() {
    var container = document.getElementById('lista_actividades');
    if (!container) return;
    var inner = container.querySelector('.tl-inner');
    if (!inner) return;

    if (!actividadesGlobales.length) {
        inner.innerHTML = '<p style="color:#888;text-align:center;padding:24px;">No hay actividades registradas.</p>';
        return;
    }

    // ── Agrupar por día (clave: "YYYY-MM-DD") ────────────────────────────────
    var diasMap = {};   // { "2026-05-10": { label: "10 may 2026", acts: [...] } }
    var diasOrden = []; // keys en orden

    actividadesGlobales.forEach(function(act) {
        var dt = (act.fechaInicio || '').replace(' ', 'T');
        var d  = new Date(dt);
        var key, label;
        if (!isNaN(d)) {
            // key para agrupar (solo fecha)
            key   = d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');
            label = d.toLocaleDateString('es', {weekday:'long', day:'2-digit', month:'long', year:'numeric'});
        } else {
            key   = act.fechaInicio || 'sin-fecha';
            label = act.fechaInicio || 'Sin fecha';
        }
        if (!diasMap[key]) {
            diasMap[key] = { label: label, acts: [] };
            diasOrden.push(key);
        }
        diasMap[key].acts.push(act);
    });

    // ── Construir HTML ────────────────────────────────────────────────────────
    var html = '';
    diasOrden.forEach(function(key, dIdx) {
        var dia  = diasMap[key];
        var nDia = dIdx + 1;

        html += '<div class="tl-item">';
        // Dot del día
        html += '<div class="tl-dot-wrap"><div class="tl-dot" style="background:#eef7d6;color:#6a9a10;border:2px solid #c8e870;font-weight:800;font-size:11px;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;letter-spacing:.5px;">D' + nDia + '</div></div>';
        html += '<div class="tl-card" style="width:100%;background:#fafcf5;border:1px solid #eef3e0;border-radius:12px;padding:14px 16px;">';

        // Cabecera del día
        html += '<div style="font-size:12px;font-weight:700;color:#7aaa1a;margin-bottom:12px;text-transform:capitalize;letter-spacing:.3px;">'
              + '\uD83D\uDCC5 ' + escapeHtml(dia.label) + '</div>';

        // Lista de actividades del día
        dia.acts.forEach(function(act) {
            var dt2  = (act.fechaInicio || '').replace(' ', 'T');
            var d2   = new Date(dt2);
            var hora = (!isNaN(d2))
                ? d2.toLocaleTimeString('es', {hour: '2-digit', minute: '2-digit'})
                : '';
            var desc = act.descripcion || '';
            if (desc.length > 220) desc = desc.substring(0, 217) + '\u2026';

            html += '<div style="display:flex;gap:12px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #f0f0f0;">';

            // Hora badge
            html += '<div style="flex-shrink:0;min-width:48px;padding-top:2px;text-align:center;">';
            if (hora) {
                html += '<span style="display:inline-block;background:#eef7d6;color:#6a9a10;border-radius:8px;padding:4px 7px;font-size:11px;font-weight:700;line-height:1.3;letter-spacing:.3px;">' + escapeHtml(hora) + '</span>';
            } else {
                html += '<span style="font-size:11px;color:#ccc;font-style:italic;">--:--</span>';
            }
            html += '</div>';

            // Detalle actividad
            html += '<div style="flex:1;min-width:0;">';
            // Nombre de la actividad — protagonista, con miniatura si hay imagen
            var imgAct = act.urlFirmada || act.urlImagen || '';
            if (act.nombre) {
                html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">';
                if (imgAct) {
                    html += '<img src="' + escapeHtml(imgAct) + '" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:8px;flex-shrink:0;opacity:.9;">';
                }
                html += '<span style="font-weight:700;font-size:14px;color:#2d3a1a;line-height:1.3;">' + escapeHtml(act.nombre) + '</span>';
                html += '</div>';
            }
            // Ciudad — sutil, debajo del nombre
            if (act.ciudadNombre || act.ciudad)
                html += '<div style="font-size:11px;color:#b0b8a0;margin-bottom:4px;letter-spacing:.2px;">\uD83D\uDCCD ' + escapeHtml(act.ciudadNombre || act.ciudad) + '</div>';
            if (desc)
                html += '<div class="tl-desc" style="font-size:12px;color:#5a6a4a;line-height:1.5;">' + escapeHtml(desc) + '</div>';
            if (act.indicaciones)
                html += '<div style="font-size:11px;color:#6a7a60;background:#f4f5f2;border-radius:6px;padding:5px 8px;margin-top:5px;">\uD83D\uDCCC ' + escapeHtml(act.indicaciones) + '</div>';
            if (act.proveedor)
                html += '<div style="font-size:11px;color:#8a9a7a;margin-top:2px;">\uD83C\uDFE2 ' + escapeHtml(act.proveedor) + '</div>';
            if (act.docs && act.docs.length)
                html += '<div style="font-size:11px;color:#a0b080;margin-top:3px;">\uD83D\uDCCE ' + act.docs.length + ' documento' + (act.docs.length > 1 ? 's' : '') + '</div>';
            html += '</div>';

            html += '</div>'; // fin actividad
        });

        html += '</div></div>'; // fin tl-card + tl-item
    });

    inner.innerHTML = html;
}
