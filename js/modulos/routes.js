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










