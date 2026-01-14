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

    var $carousel = $('#carousel-pdfs');
    $carousel.empty();
    pdfsGlobales[id].forEach((doc,index) => {
        var item = `
            <div class="pdf-item">
                <div class="pdf-frame">
                    <iframe src="${doc.url}" frameborder="0"></iframe>
                </div>
                <div class="pdf-footer">
                    <a href="#" class="btn btn-sm btn-primary" onclick="abrirPdfEnPestana('${encodeURIComponent(doc.url)}'); return false;">Descargar / Abrir</a>
                </div>
            </div>
        `;
        $carousel.append(item);
    });
}






var pdfsGlobales = {reserva:[], tickets: [], hotel: [], documentos: [], boarding: [], sim: [], seguro: [], otro: []}

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
            pdfsGlobales.reserva.push(info);
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
                    let tituloTkt = tkts.tramos.map(item => `${item.codigoCiudadSalida}➡️${item.codigoCiudadDestino}`).join(" | ");
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

    //     // RESERVAS
    //     if(element.urlFirmadaReservaCompleta){
    //         let reserva = armarDocumentos(element.urlFirmadaReservaCompleta,element.hoteles,element.rutaReservaCompleta,"img/portadas/reserva.jpg")
    //         $("#pie_hotel").show()
    //         $("#lista_hoteles").html(reserva)
    //     }
    //     else{
    //         $("#pie_hotel").hide()
    //     }
        


    //     // TICKETS
    //     if(element.tickets.length>0){
    //         let vuelo = ""
    //         element.tickets.forEach(tkts => {
    //             const existe = tkts.viajeros.some(item => Number(item.idViajero) === Number(usuario.idViajero));
    //             if(existe){
    //                 let tituloTkt = tkts.tramos.map(item => `${item.codigoCiudadSalida}➡️${item.codigoCiudadDestino}`).join(" | ");
    //                 vuelo += armarDocumentos(tkts.urlFirmada,tituloTkt,tkts.ruta,"img/portadas/tickets.jpg") 
    //             }
                
    //         });
    //         $("#pie_tickets").show()
    //         // $("#lista_tickets").html(vuelo)
    //     }
    //     else{
    //         console.log("No hay tickets")
    //         $("#pie_tickets").hide()
    //     }


    //     // DOCUMENTOS PERSONALES
    //     if(element.viajeros.length>0){

    //         var $carousel = $('#carousel-pdfs');
    //         $carousel.empty();

    //         element.viajeros.forEach(personal => {
    //             if(Number(personal.idViajero) === Number(usuario.idViajero)){
    //                 personal.docs.forEach((doc,index) => {
    //                     var item = `
    //                         <div class="pdf-item">
    //                             <div class="pdf-frame">
    //                                 <iframe src="${doc.urlFirmada}" frameborder="0"></iframe>
    //                             </div>
    //                             <div class="pdf-footer">
    //                                 <a href="#" class="btn btn-sm btn-primary" onclick="abrirPdfEnPestana('${encodeURIComponent(doc.urlFirmada)}'); return false;">Descargar / Abrir</a>
    //                             </div>
    //                         </div>
    //                     `;
    //                     $carousel.append(item);
    //                 });
    //             }
    //         });
    //         $("#pie_documentos").show()
    //         // $("#lista_documentos").html(documentos)
    //     }
    //     else{
    //         $("#pie_documentos").hide()
    //     }




    //     // EXTRAS
    //     if(element.documentos.length>0){
    //         let sim = ""
    //         let boarding = ""
    //         let seguro = ""
    //         let extras = ""
    //         element.documentos.forEach(documento => {
    //             if(Number(documento.idViajero) == Number(usuario.idViajero) && documento.mostrarTrip == 1){
    //                 // SIM CARD
    //                 documento.docs.forEach(doc => {
    //                     if(doc.idTipoDocumento == 5){
    //                         $("#pie_sim").show()
    //                         let titulo = "📲 SIM";
    //                         sim += armarDocumentos(doc.urlFirmada,titulo, doc.ruta, "img/portadas/sim.jpg") 
    //                     }

    //                     // BOARDING
    //                     if(doc.idTipoDocumento == 3){
    //                         $("#pie_boarding").show()
    //                         let titulo = "📄 Boarding Pass";
    //                         boarding += armarDocumentos(doc.urlFirmada,titulo, doc.ruta, "img/portadas/boarding.jpg") 
    //                     }

    //                     // SEGURO VIAJE
    //                     if(doc.idTipoDocumento == 4){
    //                         $("#pie_seguro").show()
    //                         let titulo = "🔒 Seguro de viajes";
    //                         seguro += armarDocumentos(doc.urlFirmada,titulo, doc.ruta, "img/portadas/seguro.jpg") 
    //                     }


    //                     // OTRO
    //                     if(doc.idTipoDocumento == 99){
    //                         $("#pie_otro").show()
    //                         let titulo = "📄 Documento Adicional";
    //                         extras += armarDocumentos(doc.urlFirmada,titulo, doc.ruta, "img/portadas/extras.jpg") 
    //                     }
                        
    //                 });
    //             }
                
    //         });
            
    //         $("#lista_sim").html(sim)
    //         $("#lista_boarding").html(boarding)
    //         $("#lista_seguro").html(seguro)
    //         $("#lista_adicionales").html(extras)
    //     }

    });
}







function armarDocumentos(url, titulo, ruta, ruta_img) {
    // Convertir PDF normal a visor de Google
    const platform = localStorage.getItem('platform');
    console.log("Sistema operativo del usuario:", platform);
    
    const googleViewer = `https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(url)}`;
    let lista = `
        <div class="pdf-container">
            <h3 style="
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 10px;
                color: #333;
                display: flex;
                align-items: center;
                gap: 8px;
                justify-content: center;
                text-align: center;
            ">
                ${titulo ? titulo : ''}
            </h3>

            <div class="pdf-frame">`
                if(!platform || platform == "android"){
                    lista += `<iframe src="${googleViewer}"></iframe>`
                }
                else{
                    lista += `<img src="${ruta_img}" alt="vista previa" style="width: 100%; height: auto;">`
                }
            lista += `
            </div>
            <div style="text-align: center; margin-top: 12px;">
                <a href="#"
                    onclick="descargarDocumento('${ruta}'); return false;"
                    style="
                        display: inline-flex;
                        align-items: center;
                        gap: 8px;
                        background: #9AC31C;
                        color: #fff;
                        padding: 10px 18px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                        transition: 0.2s ease-in-out;
                    "
                    onmouseover="this.style.background='#6a8613ff'"
                    onmouseout="this.style.background='#9AC31C'"
                >
                    <i class="fas fa-download"></i>
                    Descargar Documento
                </a>
            </div>
            <br>
        </div>
    `;

    return lista;
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





// Datos de ejemplo y funciones para renderizar reservas
// const reservasEjemplo = [
//     { id: 101, destino: 'Cancún, México', fecha: '2026-02-10' },
//     { id: 102, destino: 'Lima, Perú', fecha: '2026-03-05' },
//     { id: 103, destino: 'Cartagena, Colombia', fecha: '2026-04-12' }
// ];

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

    container.innerHTML = list.map(r => {
        // soporta tanto `destinos` como `destino` por compatibilidad
        const destinos = Array.isArray(r.destinos) ? r.destinos : (Array.isArray(r.destino) ? r.destino : []);
        const primer = destinos[0] || {};
        const primerFecha = formatDate(primer.fechaViaje) || '—';

        const destinosHtml = destinos.map(d => `
            <div class="destino-item">
                <div class="destino-emoji">🌍</div>
                <div class="destino-text">
                    <div class="destino-ciudad">${escapeHtml(d.ciudad || '—')}</div>
                    <div class="destino-fecha"> ${formatDate(d.fechaViaje) || ''}</div>
                </div>
            </div>
        `).join('');

        return `
            <article class="reserva-card" tabindex="0" role="button" onclick='showReservaId(${JSON.stringify(destinos)})' onkeydown="if(event.key==='Enter') showReservaId(${JSON.stringify(destinos)})" style="cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.08);transition:box-shadow 0.2s;">
            <div class="reserva-header">
                <div class="reserva-header-left">
                <div class="reserva-emoji">✈️</div>
                <div class="reserva-primer-fecha">${primerFecha}</div>
                </div>
                <div class="reserva-count">${destinos.length} destino${destinos.length===1?'':'s'}</div>
            </div>
            <div class="destinos-wrap">
                ${destinosHtml}
            </div>
            <div class="reserva-action" style="margin-top:12px;text-align:center;">
                <button class="btn btn-success" style="background:#9AC31C;border-color:#9AC31C;color:#fff;padding:10px 20px;font-size:16px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.07);font-weight:600;display:inline-flex;align-items:center;gap:8px;">
                <i class="fas fa-mouse-pointer"></i> Ver detalles de la reserva
                </button>
            </div>
            </article>
        `;
    }).join('');
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
    $("#tituloDestino").html(destinos.map(d => d.ciudad).filter(Boolean).join(' - '))
    selectPestana('reserva');
}


// Complementos carousel
function renderComplementos(idReserva){
    const container = document.getElementById('complementos_carousel');
    if(!container) return;

    const defaults = [
        { id: 'esim', title: 'eSIM', desc: 'Mantente conectado', img: 'https://i.insider.com/608c561d35c46f0018c0bb1c?width=1200&format=jpeg' },
        { id: 'seguro', title: 'Seguro de Viaje', desc: 'Protección durante el viaje', img: 'https://drakarelia.ec/mt-content/uploads/2024/01/seguros-medicos-1024x679.webp' },
        { id: 'actividades', title: 'Actividades', desc: 'Tours y experiencias', img: 'https://thumbs.dreamstime.com/b/elegante-experiencia-gastron%C3%B3mica-de-negocios-chef-profesional-que-prepara-comida-gourmet-en-una-estaci%C3%B3n-personal-con-vidrios-y-391222890.jpg' },
        { id: 'hoteles', title: 'Hoteles', desc: 'Reservas y upgrades', img: 'https://hips.hearstapps.com/hmg-prod/images/mejores-hoteles-lujo-espana-europa-ritz-madrid-1643808946.jpeg' },
        { id: 'dias_extra', title: 'Días Extra', desc: 'Extiende tu estadía', img: 'https://confiabogado.com/blog/wp-content/uploads/2024/01/horas-extras-vacaciones.jpg' }
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