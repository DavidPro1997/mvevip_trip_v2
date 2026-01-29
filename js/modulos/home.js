var reservasGlobales = []
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
        selectSubPestana('home')
        $("#pestana_home").hide()
        $("#pestana_reserva").show()
        $("#footer_home").show()
    }
    scrollTop()
    $("#pestana_"+id).show()
}




function selectSubPestana(id){
    if(id == 'home'){
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

    // <div class="pdf-footer">
    //                 <a href="#" class="btn btn-sm btn-primary" onclick="descargarDocumento('${doc.ruta}'); return false;">Descargar</a>
    //             </div>

    var $carousel = $('#carousel-pdfs');
    $carousel.empty();
    (pdfsGlobales[id]||[]).forEach((doc,index) => {
        var item = `
            
            <div class="pdf-item" style="position:relative;">
            <a href="#" data-documento='${JSON.stringify(doc)}' onclick="abrirModalPdfFullscreen(this); return false;" aria-label="Abrir en pantalla completa" style="position:absolute;top:8px;right:8px;width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:#007bff;color:#fff;text-decoration:none;box-shadow:0 2px 6px rgba(0,0,0,0.2);z-index:10;font-size:14px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
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
    pdfsGlobales = {tickets: [], hotel: [], documentos: [], boarding: [], sim: [], seguro: [], extras: []}
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


    




    // EXTRAS
    if(element.documentos.length>0){
        element.documentos.forEach(documento => {
            if(Number(documento.mostrarTrip) == 1){
                if(billeteraConjuntaUsuario){
                    documento.docs.forEach(doc => {
                        if(doc.idTipoDocumento == 5){
                            $("#pie_sim").show()
                            let titulo = "📲 SIM -"+documento.nombres +" "+ documento.apellidos;
                            pdfsGlobales.sim.push({
                                url: doc.urlFirmada,
                                ruta: doc.ruta,
                                titulo: titulo,
                                imagen: "img/portadas/sim.jpg"
                            })
                        }

                        // BOARDING
                        if(doc.idTipoDocumento == 3){
                            $("#pie_boarding").show()
                            let titulo = "📄 Boarding Pass -"+documento.nombres +" "+ documento.apellidos;
                            pdfsGlobales.boarding.push({
                                url: doc.urlFirmada,
                                ruta: doc.ruta,
                                titulo: titulo,
                                imagen: "img/portadas/boarding.jpg"
                            })
                        }

                        // SEGURO VIAJE
                        if(doc.idTipoDocumento == 4){
                            $("#pie_seguro").show()
                            let titulo = "🔒 Seguro de viajes -"+documento.nombres +" "+ documento.apellidos;
                            pdfsGlobales.seguro.push({
                                url: doc.urlFirmada,
                                ruta: doc.ruta,
                                titulo: titulo,
                                imagen: "img/portadas/seguro.jpg"
                            })
                        }


                        // OTRO
                        if(doc.idTipoDocumento == 99){
                            $("#pie_otro").show()
                            let titulo = "📄 Documento Adicional -"+documento.nombres +" "+ documento.apellidos;
                            pdfsGlobales.extras.push({
                                url: doc.urlFirmada,
                                ruta: doc.ruta,
                                titulo: titulo,
                                imagen: "img/portadas/extras.jpg"
                            })
                        }
                        
                    });
                }
                else{
                    if(Number(documento.idViajero) !== Number(usuario.idViajero)){
                        documento.docs.forEach(doc => {
                            if(doc.idTipoDocumento == 5){
                                $("#pie_sim").show()
                                let titulo = "📲 SIM -"+documento.nombres +" "+ documento.apellidos;
                                pdfsGlobales.sim.push({
                                    url: doc.urlFirmada,
                                    ruta: doc.ruta,
                                    titulo: titulo,
                                    imagen: "img/portadas/sim.jpg"
                                })
                            }

                            // BOARDING
                            if(doc.idTipoDocumento == 3){
                                $("#pie_boarding").show()
                                let titulo = "📄 Boarding Pass -"+documento.nombres +" "+ documento.apellidos;
                                pdfsGlobales.boarding.push({
                                    url: doc.urlFirmada,
                                    ruta: doc.ruta,
                                    titulo: titulo,
                                    imagen: "img/portadas/boarding.jpg"
                                })
                            }

                            // SEGURO VIAJE
                            if(doc.idTipoDocumento == 4){
                                $("#pie_seguro").show()
                                let titulo = "🔒 Seguro de viajes -"+documento.nombres +" "+ documento.apellidos;
                                pdfsGlobales.seguro.push({
                                    url: doc.urlFirmada,
                                    ruta: doc.ruta,
                                    titulo: titulo,
                                    imagen: "img/portadas/seguro.jpg"
                                })
                            }


                            // OTRO
                            if(doc.idTipoDocumento == 99){
                                $("#pie_otro").show()
                                let titulo = "📄 Documento Adicional -"+documento.nombres +" "+ documento.apellidos;
                                pdfsGlobales.extras.push({
                                    url: doc.urlFirmada,
                                    ruta: doc.ruta,
                                    titulo: titulo,
                                    imagen: "img/portadas/extras.jpg"
                                })
                            }
                            
                        });
                    }
                }
              
            }
            
        });
        
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
    const container = document.getElementById('complementos_carousel');
    if(!container) return;

    const defaults = [
        { id: 'esim', title: 'eSIM', desc: 'Mantente conectado', img: 'https://i.insider.com/608c561d35c46f0018c0bb1c?width=1200&format=jpeg' },
        { id: 'seguro', title: 'Seguro de Viaje', desc: 'Protección durante el viaje', img: 'https://drakarelia.ec/mt-content/uploads/2024/01/seguros-medicos-1024x679.webp' },
        { id: 'actividades', title: 'Actividades', desc: 'Tours y experiencias', img: 'https://thumbs.dreamstime.com/b/elegante-experiencia-gastron%C3%B3mica-de-negocios-chef-profesional-que-prepara-comida-gourmet-en-una-estaci%C3%B3n-personal-con-vidrios-y-391222890.jpg' },
        { id: 'vip', title: 'Salas Vip', desc: 'Comodidad y Exclusividad', img: 'https://aeronotas.com/wp-content/uploads/2022/09/Salon-Admirals-Club-de-AA.jpg' },
        { id: 'dias_extra', title: 'Días Extra', desc: 'Extiende tu estadía', img: 'https://confiabogado.com/blog/wp-content/uploads/2024/01/horas-extras-vacaciones.jpg' },
        { id: 'migratoria', title: 'Orientación Migratoria', desc: 'Acompañamos tu proceso de visa', img: 'https://imagenes.primicias.ec/files/image_480_270/uploads/2025/08/22/68a8a5691c2f2.jpeg'},
        { id: 'fast', title: 'Fast Track', desc: 'Evita Filas y ahorra tiempo', img: 'https://res.klook.com/images/fl_lossy.progressive,q_65/c_fill,w_1295,h_971/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/k40dij9mmfu2c66b1lab/ServicioVIPdelAeropuertoInternacionaldeHangzhouXiaoshan.jpg'},
        { id: 'traslados', title: 'Traslados', desc: 'Aereopuerto ↔️ Hotel', img: 'https://media.tacdn.com/media/attractions-splice-spp-360x240/06/71/93/51.jpg'},
        


    ];

    const list = defaults;

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
