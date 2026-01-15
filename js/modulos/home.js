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
    (pdfsGlobales[id]||[]).forEach((doc,index) => {
        var item = `
            <div class="pdf-item">
            <div class="pdf-title" style="font-weight:600;font-size:16px;text-align:center;margin-bottom:8px;">
            ${doc.titulo ? doc.titulo : ''}
            </div>
            <div class="pdf-frame" style="overflow:hidden;">
            <iframe src="${doc.url}" frameborder="0" style="width:300%;height:300%;transform:scale(0.35);transform-origin:0 0;zoom:35%;border:0;"></iframe>
            </div>
            <div class="pdf-footer">
            <a href="#" class="btn btn-sm btn-primary" onclick="descargarDocumento('${doc.ruta}'); return false;">Descargar</a>
            </div>
            </div>
        `;
        $carousel.append(item);
    });
    // posicionar al inicio para que se vea el primer item y parte del siguiente (1.5)
    setTimeout(function(){
        $carousel.scrollLeft(0);
    },60);
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