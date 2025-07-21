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
        .when('/hotel', {
            templateUrl : 'hotel.html',
            controller : 'HotelController'
        })
        .when('/tickets', {
            templateUrl : 'ticket.html',
            controller : 'TicketController'
        })
        .when('/boarding', {
            templateUrl : 'boarding.html',
            controller : 'BoardingController'
        })
        .when('/seguro', {
            templateUrl : 'seguro.html',
            controller : 'SeguroController'
        })
        .when('/sim', {
            templateUrl : 'sim.html',
            controller : 'SimController'
        })
        .when('/itinerario', {
            templateUrl : 'itinerario.html',
            controller : 'ItinerarioController'
        })
        .when('/otro', {
            templateUrl : 'otrosDocs.html',
            controller : 'OtroController'
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

app.controller('HotelController', ['$scope', function($scope) {
    $scope.message = 'Bienvenido al hotel';
}]);

app.controller('TicketController', ['$scope', function($scope) {
    $scope.message = 'Bienvenido a los tickets';
}]);

app.controller('BoardingController', ['$scope', function($scope) {
    $scope.message = 'Bienvenido a los boardings';
}]);

app.controller('SeguroController', ['$scope', function($scope) {
    $scope.message = 'Bienvenido a los seguros';
}]);

app.controller('SimController', ['$scope', function($scope) {
    $scope.message = 'Bienvenido a tus sims';
}]);

app.controller('ItinerarioController', ['$scope', function($scope) {
    $scope.message = 'Bienvenido a tu itinerario';
}]);

app.controller('OtroController', ['$scope', function($scope) {
    $scope.message = 'Bienvenido a tus otros documentos';
}]);










