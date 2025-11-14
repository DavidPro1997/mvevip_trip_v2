function iniciarSesion(){
    abrirSpinner("Espere, por favor...")
    const info = {
        cedula: document.getElementById("cedulaUsuario").value,
    }
    Enviar_API_Trip(JSON.stringify(info), '/iniciarSession', datos => {
        if (datos.estado){
            cerrarSpinner()
            localStorage.setItem("token",datos.consulta.token)
            mensajeUsuario('success','¡Bien!',"Sesión iniciada correctamente.").then(() => {
                conSession(datos.consulta)
            });
        }else{
            cerrarSpinner()
            mensajeUsuario('info','Oops...',datos.mensaje)
        }
    })
}





function cerrarSesion(){
    abrirSpinner("Cerrando Sesion")
    setTimeout(() => {
        
        sinSession()
    }, 500);
}




function detectarEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault(); // Previene el comportamiento por defecto, si es necesario
        iniciarSesion();        // Llama a la función iniciarSesion
    }
}



function verificarSession(){
    if (navigator.onLine) {
        Obtener_API_Trip(null, '/verificarSession', datos => {
            if (datos.estado) {
                if(datos.consulta.documentos.length > 0){
                    conSession(datos.consulta)
                }
                else{
                    sinSession('No tiene documentos activos')
                }
                
            }
            else{
                sinSession()
            }
        })
    } else {
        verificarSessionSinConexion()
    }        
}




function verificarSessionSinConexion(){
    const usuario = localStorage.getItem("usuario");
    const authToken = localStorage.getItem("authToken");
    if (usuario && authToken) {
        conSession(JSON.parse(usuario));
    } else {
        sinSession('No tiene permisos');
    }
}





function conSession(datos){
    const rutaActual = window.location.pathname;
    localStorage.setItem("usuario", JSON.stringify(datos));
    construirFooter(datos.documentos)
    $("#botonCerrarSession").show()
    $("#footer_home").show()
    if (rutaActual === "/" || rutaActual === "/login") {
        window.location.href = "/home";
    }
    
}



function construirFooter(datos){
    let lista = `
    
        <div class="footer-menu">
            <a href="/home" class="footer-item">
                <i class="fas fa-home"></i>
                <span>Inicio</span>
            </a> 
        `
    
    datos.forEach(element => {
        const primeraPalabra = element.tipoDocumento.split(' ')[0];
        lista += `
            <a href="`+element.modulo+`" class="footer-item">
            <i class="`+element.icono+`"></i>
            <span>`+primeraPalabra+`</span>
            </a>                
        `
    });
    lista += `</div>`

    $("#footer_home").html(lista)
}



function sinSession(mensaje){
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    $("#botonCerrarSession").hide()
    $("#footer_home").hide()
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