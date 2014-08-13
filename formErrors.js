angular.module('FormErrors', [])

.directive('form', ['formErrorsService', 'FormErrorsOptions', '$rootScope',
	function (formErrorsService, opts, $rootScope) {
		return {
			restrict: 'E',
			priority: 1,
			require: ['?form'],
			scope: {
				form: '=?',
				emitErrors: '@?'
			},
			// controller: [function () {}],
			link: function postLink(scope, elem, attrs, ctrls) {
				if (scope.emitErrors) {
					var formCtrl = scope.form ? scope.form : ctrls[0];
					if (!formCtrl) throw new Error(
						'You must either specify a "form" attr or place formErrors directive inside a form/ngForm.'
					);

					var thisCrawlErrors = angular.bind(formCtrl, formErrorsService.crawlErrors);
					var getErrors = function () {
						var errors = thisCrawlErrors(formCtrl, opts);
						$rootScope.$broadcast('FORM_ERRORS', {
							formName: formCtrl.$name,
							errors: errors
						});
					};

					// only update the list of errors if there was actually a change in $error
					scope.$watch(function () {
						return formCtrl.$error;
					}, getErrors, true);
				}
			}
		};
}])

.directive('ngForm', ['formErrorsService', 'FormErrorsOptions', '$rootScope',
	function (formErrorsService, opts, $rootScope) {
		return {
			restrict: 'EA',
			priority: 1,
			require: ['?form'],
			scope: {
				form: '=?',
				emitErrors: '@?'
			},
			// controller: [function () {}],
			link: function postLink(scope, elem, attrs, ctrls) {
				if (scope.emitErrors) {
					var formCtrl = scope.form ? scope.form : ctrls[0];
					if (!formCtrl) throw new Error(
						'You must either specify a "form" attr or place formErrors directive inside a form/ngForm.'
					);

					var thisCrawlErrors = angular.bind(formCtrl, formErrorsService.crawlErrors);
					var getErrors = function () {
						var errors = thisCrawlErrors(formCtrl, opts);
						$rootScope.$broadcast('FORM_ERRORS', {
							formName: formCtrl.$name,
							errors: errors
						});
					};

					// only update the list of errors if there was actually a change in $error
					scope.$watch(function () {
						return formCtrl.$error;
					}, getErrors, true);
				}
			}
		};
}])
// just put <form-errors><form-errors> wherever you want form errors
// to be displayed! (well, not WHEREVER, it has to be in a form/ngForm)
.directive('formErrors', [

	function () {
		return {
			template: function (elem) {
				if (!angular.isUndefined(elem.attr('errors-tmpl'))) {
					return '<div ng-include src="\'' + elem.attr('errors-tmpl') + '\'"></div>';
				}
				return '<ul class="form-errors">' +
					'<li class="form-error" ng-repeat="error in errors">' +
					'{{ error.message }}' +
					'</li>' +
					'</ul>';
			},
			replace: true,
			// this directive needs a higher priority than errorMessages directive
			priority: 1,
			restrict: 'AE',
			require: ['?^form'],
			// isolated scope is required so we can embed ngForms and errors
			scope: {
				formName: '@?'
			},
			controller: [

				function () {}],
			link: function postLink(scope, elem, attrs, ctrls) {
				var formName = ctrls[0] ? ctrls[0].$name : undefined;

				if (scope.formName) formName = scope.formName;

				// if we don't provide
				if (!formName) throw new Error(
					'You must either specify a "form" attr or place formErrors directive inside a form/ngForm.');

				var updateErrors = function (event, data) {
					if (data.formName === formName) {
						scope.errors = data.errors;
					}
				};
				scope.$on('FORM_ERRORS', updateErrors);
			}
		};
}])

// set a nice name to $niceName on the ngModel ctrl for later use
.directive('niceName', [

	function () {
		return {
			require: ['?ngModel', '?form'],
			link: function (scope, elem, attrs, ctrls) {
				var ctrl = ctrls[0] || ctrls[1];

				if (ctrl) ctrl.$niceName = attrs.niceName;
			}
		};
}])

// ngForm version of ngModel's niceName
.directive('formNiceName', [

	function () {
		return {
			require: 'form',
			link: function (scope, elem, attrs, ctrl) {
				console.warn('formNiceName is deprecated. Please use niceName instead.');
				ctrl.$niceName = attrs.formNiceName;
			}
		};
}])

// set an errorMessage(s) to $errorMessages on the formError or ngModel ctrl for later use
.directive('errorMessages', [

	function () {
		return {
			require: ['?ngModel', '?form'],
			link: function errorMessagesLink(scope, elem, attrs, ctrls) {
				var ctrl = ctrls[0] || ctrls[1];
				if (!ctrl) throw new Error('You attach errorMessages to either an ngModel or form.');
				// attrs.errorMessages can be:
				// 1) "must be filled out."
				// 2) "'must be filled out.'"
				// 3) "{ required: 'must be filled out.' }"
				// 1 & 2) will be the message for any kind of error
				// 3) allows you to specify each error (it will use the
				// defaultErrorMessages if you don't specify a specific error)
				try {
					ctrl.$errorMessages = scope.$eval(attrs.errorMessages);
				} catch (e) {
					ctrl.$errorMessages = attrs.errorMessages;
				}
				if (ctrls[1] && ctrl.$errorMessages) {
					if (!angular.isObject(ctrl.$errorMessages) || angular.isArray(ctrl.$errorMessages)) {
						ctrl.$errorMessages = undefined;
						throw new Error('errorMessages defined on a formErrors must be an object.');
					}
				}
			}
		};
}])

.service('formErrorsService', [
	function () {
		// humanize words, turning:
		//     camelCase  --> Camel Case
		//     dash-case  --> Dash Case
		//     snake_case --> Snake Case
		function humanize(str) {
			return str
				// turn _ and - into spaces
				.replace(/[-_+]/g, ' ')
				// put a splace before every capital letter
				.replace(/([A-Z])/g, ' $1')
				// capitalize the first letter of each word
				.replace(/^([a-z])|\s+([a-z])/g,
					function ($1) {
						return $1.toUpperCase();
					}
				);
		}

		function isController(obj) {
			// if it doesn't have a $modelValue, it's
			// an ngForm (as compared to an ngModel)
			return !obj.hasOwnProperty('$modelValue');
		}

		// this is where we form our message
		function errorMessage(name, error, props, defaultErrorMessages) {
			// get the nice name if they used the niceName
			// directive or humanize the name and call it good
			var niceName = props.$niceName || humanize(name);

			// get a message from our default set
			var message = defaultErrorMessages[error] || defaultErrorMessages.fallback;

			// if they used the errorMessages directive, grab that message
			if (typeof props.$errorMessages === 'object')
				message = props.$errorMessages[error];
			else if (typeof props.$errorMessages === 'string')
				message = props.$errorMessages;

			// return our nicely formatted message
			return niceName + ' ' + message;
		}

		return {
			crawlErrors: function (ctrl, opts, errors) {
				// "this" will be this directive's controller
				var errorMessages = angular.extend(opts.defaultErrorMessages, this.$errorMessages);

				if (!angular.isArray(errors)) errors = [];

				angular.forEach(ctrl, function (props, name) {
					// name has some internal properties we don't want to iterate over
					if (name[0] === '$') return;

					// if nested forms we ignore them
					if (isController(props)) return;

					angular.forEach(props.$error, function (isInvalid, error) {
						// don't need to even try and get a a message unless it's invalid
						if (isInvalid) {
							errors.push(new Error(errorMessage(name, error, props, errorMessages)));
						}
					});
				});

				return errors;
			}
		};
}])
// give us a way to override some options
.provider('FormErrorsOptions', [

	function () {
		// list of some default error messages
		var options = {
			defaultErrorMessages: {
				required: 'is required.',
				minlength: 'is too short.',
				maxlength: 'is too long.',
				email: 'is not a valid email address.',
				pattern: 'does not match the expected pattern.',
				number: 'is not a number.',
				url: 'is not a valid URL.',
				// form: 'has errors.',

				fallback: 'is invalid.'
			}
		};

		this.extendDefaultErrorMessages = function (messages) {
			options.defaultErrorMessages = angular.extend(options.defaultErrorMessages, messages);
		};

		this.$get = function () {
			return options;
		};
}]);
