function consultarCatalogosHome(){
    Obtener_API(null, 'website/ver-destinos', datos => {
        if (datos.estado) {
            const lista = llenarCatalogos(datos.consulta, 3)
            $("#listaCatalogosHome").html(lista)
        }
    })
}


function consultarBancosHome(){
    Obtener_API(null, 'website/bancos', datos => {
        if (datos.estado) {
            const lista = llenarBancos(datos.consulta,3)
            $("#listaBancosHome").html(lista)
        }
    })
}





