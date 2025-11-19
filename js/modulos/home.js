function cargarInformacion(){
    const usuario = JSON.parse(localStorage.getItem("usuario"));
    const reservas = JSON.parse(localStorage.getItem("reservas"));
    // console.log("Usuario: ",usuario)
    // console.log("Reservas: ",reservas)
    $("#botonCerrarSession").show()
    selectPestana('home')
    construirDOM(usuario, reservas)
}



function selectPestana(id){
    document.querySelectorAll("[id^='pestana']").forEach(el => {
        el.style.display = "none";
    });
    scrollTop()
    $("#pestana_"+id).show()
}





function construirDOM(usuario, reservas){
    console.log(usuario)
    $("#tituloPrincipal").html("¡HOLA " + usuario.nombres.toUpperCase() + " " + usuario.apellidos.toUpperCase() + "!");
    reservas.forEach(element => {
        // HOTELES
        if(element.hoteles.length>0 && element.urlFirmadaHoteles){
            let hotel = ""
            let tituloHotel = "🏨"+element.hoteles[0].fechaCheckIn+ " <br> "+element.hoteles.map(item => item.hotel).join(" - ");
            hotel += armarDocumentos(element.urlFirmadaHoteles,tituloHotel)
            element.hoteles.forEach(documentos => {
                documentos.docs.forEach(element_2 => {
                    if(element_2.idTipoDocumento != 15){
                    hotel += armarDocumentos(element_2.urlFirmada) 
                    }
                });
            });
            $("#pie_hotel").show()
            $("#lista_hoteles").html(hotel)
        }
        else{
            $("#pie_hotel").hide()
        }


        // ACTIVIDADES
        if(element.actividades.length>0 && element.urlFirmadaActividades){
            let activ = ""
            let tituloActividad = "🏃‍♂️"+element.actividades[0].fechaInicio+ "<br>"+element.actividades.map(item => item.nombre).join("<br>");
            activ += armarDocumentos(element.urlFirmadaActividades,tituloActividad)
            element.actividades.forEach(documentos => {
                documentos.docs.forEach(element_2 => {
                    if(element_2.idTipoDocumento != 16){
                    activ += armarDocumentos(element_2.urlFirmada) 
                    }
                });
            });
            $("#pie_actividades").show()
            $("#lista_actividades").html(activ)
        }
        else{
            $("#pie_actividades").hide()
        }


        // TRANSFER
        if(element.transfer.length>0 && element.urlFirmadaTransfer){
            let transfer = ""
            let tituloTransfer = "🚌"+element.transfer[0].salida+ "<br>"+element.transfer.map(item => item.tipoTransfer).join("<br>");
            transfer += armarDocumentos(element.urlFirmadaTransfer,tituloTransfer)
            element.transfer.forEach(documentos => {
                documentos.docs.forEach(element_2 => {
                    if(element_2.idTipoDocumento != 17){
                    transfer += armarDocumentos(element_2.urlFirmada) 
                    }
                });
            });
            $("#pie_transfer").show()
            $("#lista_transfer").html(transfer)
        }
        else{
            $("#pie_transfer").hide()
        }


        // AUTO
        if(element.autos.length>0 && element.urlFirmadaAutos){
            let carro = ""
            let tituloAuto = "🚗"+element.autos[0].inicio+ "<br>"+element.autos.map(item => item.nombreAuto).join("<br>");
            carro += armarDocumentos(element.urlFirmadaAutos,tituloAuto)
            element.autos.forEach(documentos => {
                documentos.docs.forEach(element_2 => {
                    if(element_2.idTipoDocumento != 18){
                        carro += armarDocumentos(element_2.urlFirmada) 
                    }
                });
            });
            $("#pie_auto").show()
            $("#lista_auto").html(carro)
        }
        else{
            $("#pie_auto").hide()
        }


        // TICKETS
        if(element.tickets.length>0){
            let vuelo = ""
            element.tickets.forEach(tkts => {
                const existe = tkts.viajeros.some(item => Number(item.idViajero) === Number(usuario.idViajero));
                if(existe){
                    let tituloTkt = "✈️ Ticket Aéreo<br>"+tkts.tramos.map(item => `${item.codigoCiudadSalida}➡️${item.codigoCiudadDestino}`).join("-");
                    vuelo += armarDocumentos(tkts.urlFirmada,tituloTkt) 
                }
                
            });
            $("#pie_ticket").show()
            $("#lista_tickets").html(vuelo)
        }
        else{
            $("#pie_ticket").hide()
        }


        // EXTRAS
        if(element.documentos.length>0){
            let docs_extras = ""
            element.documentos.forEach(documento => {
                if(Number(documento.idViajero) == Number(usuario.idViajero)){
                    // SIM CARD
                    if(documento.idTipoDocumento == 5){
                        let titulo = "📲 SIM";
                        docs_extras += armarDocumentos(documento.urlFirmada,titulo) 
                    }

                    // BOARDING
                    if(documento.idTipoDocumento == 3){
                        let titulo = "📄 Boarding Pass";
                        docs_extras += armarDocumentos(documento.urlFirmada,titulo) 
                    }

                    // SEGURO VIAJE
                    if(documento.idTipoDocumento == 4){
                        let titulo = "🔒 Seguro de viajes";
                        docs_extras += armarDocumentos(documento.urlFirmada,titulo) 
                    }

                    
                }
                
            });
            $("#pie_otro").show()
            $("#lista_adicionales").html(docs_extras)
        }
        else{
            $("#pie_otro").hide()
        }



    });

    


    // if(datos.actividades.length>0){
    //     $("#pie_actividades").show()
    //     armarDocumentos(datos.actividades, "lista_actividades")
    // }
    // else{
    //      $("#pie_actividades").hide()
    // }



    // if(datos.transfers.length>0){
    //     $("#pie_transfer").show()
    //     armarDocumentos(datos.transfers, "lista_transfer")
    // }
    // else{
    //      $("#pie_transfer").hide()
    // }


    // if(datos.autos.length>0){
    //     $("#pie_auto").show()
    //     armarDocumentos(datos.transfers, "lista_auto")
        
    // }
    // else{
    //      $("#pie_auto").hide()
    // }

}






function armarDocumentos(url, titulo) {
    // Convertir PDF normal a visor de Google
    const googleViewer = `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodeURIComponent(url)}`;

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

            <div class="pdf-frame">
                <iframe src="${googleViewer}"></iframe>
            </div>
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
