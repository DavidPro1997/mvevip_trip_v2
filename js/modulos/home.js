function cargarInformacion(){
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const reservas = JSON.parse(localStorage.getItem("reservas"));
    console.log("Usuario: ",usuario)
    console.log("Reservas: ",reservas)
    if (usuario && reservas){
        renderReservations(reservas);
        renderComplementos(reservas[reservas.length - 1].idReserva);
        $("#botonCerrarSession").show()
        selectPestana('home')
        construirDOM(usuario, reservas)
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



function selectPestana(id){
    if(id == "home"){
        $("#pestana_home").show()
        $("#pestana_reserva").hide()
        $("#footer_home").hide()
    }
    else{
        // simular click en el pie de documentos (si existe)
        setTimeout(() => {
            var pie = document.getElementById('pie_documentos');
            if (pie) {
                try { 
                    console.log("Simulando click en el pie de documentos");
                    pie.click(); 
                } catch (e) { 
                    console.error("Error al simular click en el pie de documentos:", e);
                    $('#pie_documentos').trigger('click'); 
                }
            }
        }, 500);
        
        selectSubPestana('documentos')
        $("#pestana_home").hide()
        $("#pestana_reserva").show()
        $("#footer_home").show()
    }
    scrollTop()
    $("#pestana_"+id).show()
}




function selectSubPestana(id){
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
            <a href="#" onclick="descargarDocumento('${doc.ruta}'); return false;" aria-label="Descargar" style="position:absolute;top:8px;right:8px;width:36px;height:36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:#007bff;color:#fff;text-decoration:none;box-shadow:0 2px 6px rgba(0,0,0,0.2);z-index:10;font-size:14px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </a>
            <div class="pdf-title" style="font-weight:600;font-size:16px;text-align:center;margin-bottom:8px;">
                ${doc.titulo ? doc.titulo : ''}
            </div>
            <div class="pdf-frame" style="overflow:hidden;">
                <iframe
                    src="https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(doc.url)}"
                    style="width:100%; height:400px; border:0;">
                </iframe>

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


{/* 
    

    <iframe 
                    src="${doc.url}#zoom=90&view=FitH"
                    style="width:100%; height:400px; border:0;"
                    frameborder="0">
                </iframe>

    <div class="pdf-item">
                <div class="pdf-title" style="font-weight:600;font-size:16px;text-align:center;margin-bottom:8px;">
                    ${doc.titulo ? doc.titulo : ''}
                </div>
                <div class="pdf-frame" style="overflow:hidden;">
                    <iframe src="${doc.url}" frameborder="0" style="width:300%;height:300%;transform:scale(0.50);transform-origin:0 0;zoom:50%;border:0;"></iframe>
                </div>
                
            </div> */}



var pdfsGlobales = {tickets: [], hotel: [], documentos: [], boarding: [], sim: [], seguro: [], otro: []}

function construirDOM(usuario, reservas){
    quitarFooter()
    $("#tituloPrincipal").html("¡HOLA " + usuario.nombres.toUpperCase() + " " + usuario.apellidos.toUpperCase() + "!");
    reservas.forEach(element => {

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
                const existe = tkts.viajeros.some(item => Number(item.idViajero) === Number(usuario.idViajero));
                if(existe){
                    let tituloTkt = tkts.tramos.map(item => `${item.codigoCiudadSalida}➡️${item.codigoCiudadDestino}`).join("<br>");
                    pdfsGlobales.tickets.push({
                        url: tkts.urlFirmada,
                        ruta: tkts.ruta,
                        titulo: tituloTkt,
                        imagen: "img/portadas/tickets.jpg"
                    })
                }
                
            });
            $("#pie_tickets").show()
        }
        else{
            $("#pie_tickets").hide()
        }


        // DOCUMENTOS PERSONALES
        if(element.viajeros.length>0){
            element.viajeros.forEach(personal => {
                if(Number(personal.idViajero) === Number(usuario.idViajero)){
                    personal.docs.forEach(doc => {
                        let tituloPersonal = doc.tipoDocumento
                        pdfsGlobales.documentos.push({
                            url: doc.urlFirmada,
                            ruta: doc.ruta,
                            titulo: tituloPersonal,
                            imagen: "img/portadas/personales.jpg"
                        })
                    });
                }                
            });
            $("#pie_documentos").show()
        }
        else{
            $("#pie_documentos").hide()
        }




        // EXTRAS
        if(element.documentos.length>0){
            element.documentos.forEach(documento => {
                if(Number(documento.idViajero) == Number(usuario.idViajero) && documento.mostrarTrip == 1){
                    // SIM CARD
                    documento.docs.forEach(doc => {
                        if(doc.idTipoDocumento == 5){
                            $("#pie_sim").show()
                            let titulo = "📲 SIM";
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
                            let titulo = "📄 Boarding Pass";
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
                            let titulo = "🔒 Seguro de viajes";
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
                            let titulo = "📄 Documento Adicional";
                            pdfsGlobales.extras.push({
                                url: doc.urlFirmada,
                                ruta: doc.ruta,
                                titulo: titulo,
                                imagen: "img/portadas/extras.jpg"
                            })
                        }
                        
                    });
                }
                
            });
            
            
        }

    });
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
        const hero = document.getElementById("hero");
        hero.style.backgroundImage = `url('${destinos[0].urlImagen}')`;
    }
    $("#tituloDestino").html(destinos.map(d => d.ciudad).filter(Boolean).join(' - '))
    selectPestana('reserva');
}


// Complementos carousel
// function renderComplementos(idReserva){
//     const container = document.getElementById('complementos_carousel');
//     if(!container) return;

//     const defaults = [
//         { id: 'esim', title: 'eSIM', desc: 'Mantente conectado', img: 'https://i.insider.com/608c561d35c46f0018c0bb1c?width=1200&format=jpeg' },
//         { id: 'seguro', title: 'Seguro de Viaje', desc: 'Protección durante el viaje', img: 'https://drakarelia.ec/mt-content/uploads/2024/01/seguros-medicos-1024x679.webp' },
//         { id: 'actividades', title: 'Actividades', desc: 'Tours y experiencias', img: 'https://thumbs.dreamstime.com/b/elegante-experiencia-gastron%C3%B3mica-de-negocios-chef-profesional-que-prepara-comida-gourmet-en-una-estaci%C3%B3n-personal-con-vidrios-y-391222890.jpg' },
//         { id: 'vip', title: 'Salas Vip', desc: 'Comodidad y Exclusividad', img: 'https://aeronotas.com/wp-content/uploads/2022/09/Salon-Admirals-Club-de-AA.jpg' },
//         { id: 'dias_extra', title: 'Días Extra', desc: 'Extiende tu estadía', img: 'https://confiabogado.com/blog/wp-content/uploads/2024/01/horas-extras-vacaciones.jpg' },
//         { id: 'migratoria', title: 'Orientación Migratoria', desc: 'Acompañamos tu proceso de visa', img: 'https://imagenes.primicias.ec/files/image_480_270/uploads/2025/08/22/68a8a5691c2f2.jpeg'},
//         { id: 'fast', title: 'Fast Track', desc: 'Evita Filas y ahorra tiempo', img: 'https://res.klook.com/images/fl_lossy.progressive,q_65/c_fill,w_1295,h_971/w_80,x_15,y_15,g_south_west,l_Klook_water_br_trans_yhcmh3/activities/k40dij9mmfu2c66b1lab/ServicioVIPdelAeropuertoInternacionaldeHangzhouXiaoshan.jpg'},
//         { id: 'traslados', title: 'Traslados', desc: 'Aereopuerto ↔️ Hotel', img: 'https://media.tacdn.com/media/attractions-splice-spp-360x240/06/71/93/51.jpg'},
        


//     ];

//     const list = defaults;

//     container.innerHTML = list.map(it => `
//         <div class="comp-card" role="button" tabindex="0" onclick="abrirChatWhatsApp('Hola equipo de reservas de Marketing Vip, quisiera adquerir el servicio complmentario de ${escapeHtml(String(it.title))} para mi reserva. Mi ID de reserva es: ${idReserva}')" onkeydown="if(event.key==='Enter') onComplementoClick('${escapeHtml(String(it.id))}')">
//             <img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.title)}">
//             <div class="comp-body">
//                 <div class="comp-title">${escapeHtml(it.title)}</div>
//                 <div class="comp-desc">${escapeHtml(it.desc)}</div>
//             </div>
//         </div>
//     `).join('');
// }



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

    let lista = ""
    lista += defaults.map(it => `
        <div class="comp-card" role="button" tabindex="0" onclick="abrirChatWhatsApp('Hola equipo de reservas de Marketing Vip, quisiera adquerir el servicio complmentario de ${escapeHtml(String(it.title))} para mi reserva. Mi ID de reserva es: ${idReserva}')" onkeydown="if(event.key==='Enter') onComplementoClick('${escapeHtml(String(it.id))}')">
            <img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.title)}">
        </div>
    `).join('');
    container.innerHTML = lista;
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
