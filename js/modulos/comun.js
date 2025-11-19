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







function verificarSession(){
    abrirSpinner("Consultando sus documentos")
    if (navigator.onLine) {
        Obtener_API_Trip(null, '/verificarSession', datos => {
            // setTimeout(() => {
            //     cerrarSpinner()
            // }, 500);
            // if (datos.estado) {
            //     conSession(datos)
            // }
            // else{
            //     sinSession()
            // }
        })
    } else {
        // verificarSessionSinConexion()
    }        
}






function conSession(datos){
    if(datos.consulta){
        localStorage.setItem("usuario", JSON.stringify(datos.consulta));
    }
    localStorage.setItem("reservas", JSON.stringify(datos.reservas));
    const rutaActual = window.location.pathname;
    $("#botonCerrarSession").show()
    if (rutaActual === "/" || rutaActual === "/login") {
        window.location.href = "/home";
    }
    else{
        cargarInformacion()
    }  
}






function sinSession(mensaje){
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    $("#botonCerrarSession").hide()
    
    if(mensaje){
        mensajeUsuario('info','Información',mensaje).then(()=>{
            const rutaActual = window.location.pathname;
            if (rutaActual !== "/login") {
                window.location.href = "/login";
            }
        })
    }
    else{
        const rutaActual = window.location.pathname;
        if (rutaActual !== "/login") {
            window.location.href = "/login";
        }
    }
    
    
}