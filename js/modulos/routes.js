// Creación del módulo
var app = angular.module('mvevip', ['ngRoute']);

// Configuración de las rutas
app.config(['$routeProvider', '$locationProvider',function($routeProvider, $locationProvider) {

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false // Opcional, pero útil si no tienes una etiqueta <base> configurada correctamente
    });


    $routeProvider
        .when('/', {
            templateUrl : 'login.html',
            controller : 'LoginController'
        })
        .when('/login', {
            templateUrl : 'login.html',
            controller : 'LoginController'
        })
        .when('/home', {
            templateUrl : 'home.html',
            controller : 'HomeController'
        })
        
        .otherwise({
            redirectTo: '/login'
        });
    
    $locationProvider.html5Mode(true);

}]);

// Definir controladores (pueden estar en archivos separados)
app.controller('HomeController', ['$scope', function($scope) {
    $scope.message = 'Bienvenido al Home';
}]);

app.controller('LoginController', ['$scope', function($scope) {
    $scope.message = 'Bienvenido al login';
}]);

// Ocultar header en rutas sin sesión
app.run(['$rootScope', function($rootScope) {
    var rutasSinHeader = ['/login', '/'];
    $rootScope.$on('$routeChangeSuccess', function(e, current) {
        var path = current && current.$$route && current.$$route.originalPath;
        var header = document.querySelector('header');
        if (header) {
            header.style.display = rutasSinHeader.indexOf(path) !== -1 ? 'none' : '';
        }
    });
}]);










