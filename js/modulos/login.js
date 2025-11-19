function iniciarSesion(){
    abrirSpinner("Espere, por favor...")
    const info = {
        cedula: document.getElementById("cedulaUsuario").value,
    }
    Enviar_API_Trip(JSON.stringify(info), '/iniciarSession', datos => {
        if (datos.estado){
            setTimeout(() => {
                cerrarSpinner()
                mensajeUsuario('success','¡Bien!',"Sesión iniciada correctamente.").then(() => {
                    conSession(datos)
                });
            }, 500);
            
            
        }else{
            setTimeout(() => {
                cerrarSpinner()
                mensajeUsuario('info','Oops...',datos.mensaje)
            }, 500);
            
        }
    })
}




function verificarData(){
    const datos = {
        consulta: JSON.parse(localStorage.getItem("usuario")),
        reservas: JSON.parse(localStorage.getItem("reservas"))
    }
    if (datos.consulta && datos.reservas){
        conSession(datos)
    }
    else{
        sinSession()
    }
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

