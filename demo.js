var app = angular.module('app', ['FormErrors']);

app.config(function (FormErrorsOptionsProvider) {
	FormErrorsOptionsProvider.extendDefaultErrorMessages({
		// It only overrides what you pass it. All
		// other default messages will be left alone
		form: 'has some errors. Please fix them.'
	});
});

app.controller('MainCtrl', function ($scope) {
	$scope.emitErrors = true;
	$scope.errors = {};
	$scope.showChildren = false;

	$scope.errorMessages = {
		required: 'é necessário.',
		minlength: 'é demasiado curto.',
	};

	$scope.$on('FORM_ERRORS', function (event, data) {
		if (data.errors !== [])
			$scope.errors[data.formName] = data.errors;
		else
			delete $scope.errors[data.formName];
	});

	$scope.submit = function () {
		if ($scope.loginForm.$valid) {
			$scope.emitErrors = false;
			$scope.message = 'Form is valid!';
		} else {
			$scope.emitErrors = true;
			$scope.message = 'Please correct the above errors.';
		}
	};
});
