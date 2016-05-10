(function(angular){'use strict';

angular.module('users')

.config(['$routeProvider', function($routeProvider){
  $routeProvider.when('/login', {
    templateUrl: '/client/src/app/users/login.html',
    controller: LoginView
  });
  $routeProvider.when('/reset-password', {
    templateUrl: '/client/src/app/users/reset-password.html',
    controller: ResetPasswordView
  });
  $routeProvider.when('/reset-password/confirm/:user/:key', {
    templateUrl: '/client/src/app/users/reset-password-confirm.html',
    controller: ResetPasswordConfirmView
  });
  if (window.customer && !window.customer.users.signupDisabled) {
    $routeProvider.when('/signup', {
      templateUrl: '/client/src/app/users/signup.html',
      controller: SignupView
    });
  }
}]);

function LoginView($scope) {
  $scope.$root.bodyClass = 'login';
  $scope.$root.title = 'Login';
}
function ResetPasswordView($scope, usersService) {
  $scope.$root.bodyClass = 'login';
  $scope.$root.title = 'Reset password';

  $scope.resetPassword = function(email) {
    usersService.resetPassword({ email: email });
    $scope.message = "Thanks! We've sent a password reset link to your email.";
    $scope.email = null;
    $scope.finished = true;
  };
}
function ResetPasswordConfirmView($routeParams, $scope, usersService) {
  $scope.$root.bodyClass = 'login';
  $scope.$root.title = 'Reset password';

  $scope.resetPassword = function() {
    $scope.message = null;
    if ($scope.password1 !== $scope.password2) {
      $scope.message = {
        type: 'alert-danger',
        message: "Those passwords don't match"
      };
    } else {
      usersService.resetPasswordConfirm({
        user: $routeParams.user,
        key: $routeParams.key,
        password: $scope.password1
      }).then(function(response) {
        $scope.finished = true;
        $scope.message = {
          type: 'alert-success',
          message: "Your password has been successfully changed."
        };
      }, function() {
        $scope.message = {
          type: 'alert-danger',
          message: "There was an error changing your password. " +
                   "The link you followed may no longer be valid."
        };
      });
    }
  };
}
function SignupView($scope) {
  $scope.$root.bodyClass = 'login';
  $scope.$root.title = 'Signup';
}

LoginView.$inject = [
  '$scope'
];
ResetPasswordView.$inject = [
  '$scope',
  'users'
];
ResetPasswordConfirmView.$inject = [
  '$routeParams',
  '$scope',
  'users'
];
SignupView.$inject = [
  '$scope'
];

})(angular);
