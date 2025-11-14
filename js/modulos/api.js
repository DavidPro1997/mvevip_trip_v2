const api_trip = "http://localhost:5006"
// es igual que el de reservas brow
var token = localStorage.getItem("token");



function Obtener_API_Trip(campos, modulo, callbackSuccess, callbackError, ver_consola = true) {
    
    $.ajax({
        url: api_trip + modulo,
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        type: 'GET',
        data: campos,
        dataType: 'json',
        success: function(datos) {
            if (ver_consola) {
                console.log(datos, modulo);
            }
            if (typeof callbackSuccess === "function") {
                callbackSuccess(datos);
            }
        },
        error: function(e) {
            if (ver_consola) {
                console.log("Error:", e, modulo);
            }
            if (typeof callbackError === "function") {
                callbackError(e);
            }
        }
    });
}



function Enviar_API_Trip(campos, modulo, callback){    
    $.ajax({
        url: api_trip+modulo,
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        type: 'POST',
        data: campos,
		dataType: 'json',
		success: function(datos){ 
            console.log(datos, modulo)
            if (typeof callback === "function") {
                callback(datos);
            }
        },
		error: function(e){
            console.log(e, modulo);
			if (typeof callback === "function") {
                callback(e);
            }
		}
    });  
}




function Archivos_API_Trip(campos, modulo, callback) {
    const esFormData = campos instanceof FormData;

    $.ajax({
        url: api_trip + modulo,
        headers: esFormData ? {
            'Authorization': token
        } : {
            'Authorization': token,
            'Content-Type': 'application/json'
        },
        type: 'POST',
        data: campos,
        dataType: 'json',
        processData: !esFormData,
        contentType: esFormData ? false : 'application/json',
        success: function (datos) {
            console.log(datos, modulo);
            if (typeof callback === "function") {
                callback(datos);
            }
        },
        error: function (e) {
            console.log(e, modulo);
            if (typeof callback === "function") {
                callback(e);
            }
        }
    });
}
