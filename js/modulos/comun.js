var numeroTelefono = "+593993111114"
var email = "info@mvevip.com"
var facebook = "https://www.facebook.com/share/eAaQqQzrMvU7T4MV"
var instagram = "https://www.instagram.com/marketingvipecuador"
var tiktok = "https://www.tiktok.com/@marketingvipecuador"
var youtube = "https://www.youtube.com/channel/UCTb9vJwhQcB7Ea_1va1o7bg"





function abrirSpinner(mensaje){
    $("#mensajeSpinner").html(mensaje)
    $("#centermodal").modal({
        backdrop: 'static',
        keyboard: false
    }).modal('show')
}


function cerrarSpinner(){
    $("#centermodal").modal('hide');
}




function mensajeUsuario(icono,titulo,mensaje,si_no = null){
    if(!si_no){
        return Swal.fire( {
            title: titulo,
            text: mensaje,
            icon: icono,
            confirmButtonText: 'Entendido'
        });
    }
    else{
        return Swal.fire({
            title: titulo,
            text: mensaje,
            icon: icono,
            showCancelButton: true,
            confirmButtonText: 'Sí',
            cancelButtonText: 'No'
        });
    }
}




function scrollTop() {
    window.scrollTo(0, 0);
}





function abrirChatWhatsApp(mensaje) {
    if(!mensaje){
        mensaje = "Hola quiero información sobre sus servicios..."
    }
    const mensajeCodificado = encodeURIComponent(mensaje);
    const url = `https://wa.me/${numeroTelefono}?text=${mensajeCodificado}`;
    window.open(url, '_blank');
}

function obtenerCorreo(){
    return email
}

function obtenerNumero(){
    return numeroTelefono
}


function abrirLlamada(){
    window.location.href = `tel:${numeroTelefono}`;
}

function enviarCorreo(asunto, cuerpo) {
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    window.location.href = mailtoLink;
}

function abrirFacebook(){
    window.open(facebook, '_blank');
}

function abrirInstagram(){
    window.open(instagram, '_blank');
}

function abrirTiktok(){
    window.open(tiktok, '_blank');
}

function abrirYoutube(){
    window.open(youtube, '_blank');
}

function cerrarMenu(){
    $('.main-menu').removeClass('show'); 
    $('.layer').removeClass('layer-is-visible');
}




function armarDocumentos(datos, id, imagen){
    let lista = ""
    datos.forEach(element => {
        lista += `
            <div class="main_title mt-3">
                <h2>TU `+element.tipoDocumento.toUpperCase()+` <span>${element.destino ? 'EN '+element.destino.toUpperCase() : ''}</span> </h2>
            </div>
            <div class="row mt-4">
                <div style="text-align: center; padding: 20px;">
                    <button onclick="descargarDocumento('`+element.ruta+`')" style="padding: 0; border: none; background: none;">
                        <img src="img/documentos/`+imagen+`" 
                            style="width: 100%; height: auto; max-width: 800px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); border: 3px solid #9AC31C; cursor: pointer;" 
                            alt="Imagen de reserva">
                    </button>
                </div>
            </div>
        `
    });
    $("#"+id).html(lista)
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