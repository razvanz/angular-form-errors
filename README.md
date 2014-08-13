# AngularJS Form Errors Directive

A set of directives to make it easier to get a list of form errors with the posibility of getting them anywhere in your app.

### Why?

Because it's a lot of work to do all those inline errors and to do markup for *every single* error that each input can violate. And maybe it doesn't fit in your design to do inline errors, etc, etc.

Why not just do everything (list *all* your form's errors, with messages) with **just a single element?**

## Installation

Install with [Bower](http://bower.io/):

```bash
bower install angular-form-errors
```

Add the `formErrors.js` file to your HTML. For example:

```html
<script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.2.16/angular.js"></script>
<script src="/path/to/formErrors.js"></script>
<script src="/path/to/your/app.js"></script>
```

Include the `FormErrors` module in your module:

```javascript
angular.module('app', ['FormErrors']);
```

## Usage

For basic usage, all that's needed is to place a single element inside a `form` element:

```html
<form name="form" emit-errors="true" novalidate>
  <input type="text" name="name" required ng-model="name">
  ...
  <form-errors></form-errors>
</form>
```

**NOTE:** For this validation to work, you need a `name` attribute on your `form` element and on any form elements (i.e. `input`, `select`, etc) inside the form.

## Example

HTML markup:

```html
<form ng-class="{ 'show-errors': emitErrors }" emit-errors="{{emitErrors}}" name="loginForm" ng-submit="submit()" role="form" novalidate>
  <div class="form-group">
    <label for="inputUsername" class="control-label">Username (min 5 char)</label>
    <input type="text" name="username" class="form-control" id="inputUsername" placeholder="Username" ng-minlength="5" required ng-model="user.username">
  </div>

  <div class="form-group">
    <label for="inputPassword" class="control-label">Password (min 8 char)</label>
    <input type="password" name="password" class="form-control" id="inputPassword" placeholder="Password" ng-minlength="8" required ng-model="user.password">
  </div>

  <div class="form-group">
    <button type="submit" class="btn btn-primary">Sign in</button>
  </div>

  <p>{{ message }}</p>
  <form-errors class="list-unstyled"></form-errors>
</form>
```

JavaScript (just displays if the form is valid on valid submit):

```javascript
var app = angular.module('app', ['FormErrors']);

app.controller('MainCtrl', function ($scope) {
  $scope.emitErrors = true;
  $scope.submit = function () {
    if ($scope.loginForm.$valid) {
      $scope.message = 'Form is valid!';
    } else {}
      $scope.message = 'Please correct these errors:';
    }
  };
});
```

If the fields are empty (which are both required), then `<form-errors></form-errors>` would list the fields and their errors.

Demo: http://blooderking.github.io/angular-form-errors-directive

## The Finer Points

Where does it get the name that's invalid and how does it know what message to display? The name comes from the input's name attribute (attached in the form controller).

It does some automagic transformations to "humanize" it. For example, `firstName` gets turned into `First Name`.

For the error message, I have a few default error messages that correspond to keys that Angular sets. Here's the said list:

```javascript
defaultErrorMessages = {
    required  : 'is required.',
    minlength : 'is too short.',
    maxlength : 'is too long.',
    email     : 'is not a valid email address.',
    pattern   : 'does not match the expected pattern.',
    number    : 'is not a number.',
    url       : 'is not a valid URL.',
    form      : 'has errors.',

    fallback  : 'is invalid.'
}
```

### Custom Names and Messages

Let's say you have this `input`:

```html
<input type="url" name="website-url" ng-model="websiteUrl">
```

and let's say you want to say more than **Website Url is not a valid URL.** You can add a `nice-name` attribute to your `input` elements and it uses that name instead. i.e. `nice-name="Website URL"`

If you want a custom message, you can also add an `error-messages` attribute. You can either set just a string, and *all* errors will use that message, or you can use an object to set individual errors (and if one isn't found, it will fall back to a default error message).

So maybe this is our enhanced markup we use:

```html
<input type="url" name="website-url" ng-model="websiteUrl"
    required nice-name="Website URL"
    error-messages="{ url: 'is not a valid URL. Don\'t forget the http:// at the start' }">
```

If the field is empty, it will fallback to **Website URL is required.** If the URL is not valid, it will display **Website URL is not a valid URL. Don't forget the http:// at the start**

You can also pass the `error-messages` attribute a string and it will use that for every error. A nice shortcut when you don't need to specify every kind of different error.


### Explicit Form

If you don't want to place a `formErrors` directive in a specific `form` (or if you want to put it in a form but show errors to a different form), you can specify a specific `form` via the `form-name` attribute:

```html
<form name="theForm">
  <!-- form goes here -->
</form>
<!-- still works outside of the <form> tag cuz we specify a specific form -->
<form-errors form-name="theForm"></form-errors>
```

Specifying a specific form via the `form-name` attribute overrides inheriting the form it's embedded in.

### Overriding and Extending the Default Error Messages

You can override the default error messages via a provider at config:

```javascript
app.config(function (FormErrorsOptionsProvider) {
    FormErrorsOptionsProvider.extendDefaultErrorMessages({
        // It only overrides what you pass it. All
        // other default messages will be left alone
        form: 'has some errors. Please fix them.'
    });
})
```

That way you don't have to pass each input an override if you use it globally. This is also a great place to add validation messages for custom/nonstandard error messages. For example, if I had a directive that checked if two fields matched, and if they didn't the `ngModelCtrl.$error.match` was set, you could pass in a default message here; something like `{ match: 'does not match.' }`.

#### Overriding/Extending Default Error Messages Per Directive

You can also override the default messages on a per-`form` basis. This is done similar to how you can override each input's messages, but in this case, it **must** be an object and not a string. The `error-messages` directive on a specific input will override `error-messages` on a `form` which will override the default set by the options provider:

```html
<form name="theForm"  error-messages="{ required: 'needs to be non-blank.' }">
  <!-- form goes here -->

  <!-- this will override the default error messages
       for all the errors in this <form-errors>  -->
  <form-errors></form-errors>
</form>
```
#### Using a template for displaying the error messages

You can use your template for showing the error messages. All you need to do is to add a `errors-tmpl` attribute with the value of the templateUrl: `errors-tmpl="formErrors.html"`. The template will be attached with the `ng-include` directive. In the template you will access the errors through the `errors` array: (`[ Error ('Username is required.'), Error ('Username is too short.'), ...]`).

```html
<form name="theForm" error-messages="{ required: 'needs to be non-blank.' }">
  <!-- form goes here -->

  <!-- this will override the default error messages
       for all the errors in this <form-errors>  -->
  <form-errors errors-tmpl="formErrors.html"></form-errors>
</form>
```
By default the template used to display the errors looks like this:

```html
<ul class="form-errors">
  <li class="form-error" ng-repeat="error in errors">
    {{ error.message }}
  </li>
</ul>
```

#### Getting the errors anywhere in your app

If you thought the previous features were great wait for this part. Let's just say that you don't want to have the errors in another place in your app, or you want to stack the user's erros somewhere and then do some data analytics on them (or anything else crossing your mind). Now you can.

Because this directive is using `events` which are broadcasted down from the `$rootScope`, you can listen `$on` a `'FORM_ERRORS'` `event` anywhere in your app. Along with the event you will get a parameter `object` that contains the form name and the list of errors. Eg: `{'loginForm', [Error('username is required.')]}`.

```html
<form name="theForm" error-messages="{ required: 'needs to be non-blank.' }">
  <!-- form goes here -->

  <!-- this will override the default error messages
       for all the errors in this <form-errors>  -->
  <form-errors errors-tmpl="formErrors.html"></form-errors>
</form>
```
By default the template used to display the errors looks like this:

```html
<ul class="form-errors">
  <li class="form-error" ng-repeat="error in errors">
    {{ error.message }}
  </li>
</ul>
```

## Changelog

- **v0.1.0** Basic functionality. Module [angular-form-errors-directive](https://github.com/CWSpear/angular-form-errors-directive) rewrote.

## Original module

This module is based on CWSpear's [angular-form-errors-directive](https://github.com/CWSpear/angular-form-errors-directive).
You can find him on Twitter: [@CWSpear](https://twitter.com/CWSpear) or check his [blog](http://cameronspear.com/blog/).
