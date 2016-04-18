'use strict';
(function () {
	/**
	 * @ngdoc function
	 * @name todoApp.controller:HeaderCtrl
	 * @description
	 * # HeaderCtrl
	 * Header controller of the todoApp, identifying the current user
	 */
	angular.module('mytodoApp').controller('HeaderCtrl', ['$state', 'AuthService', HeaderCtrl]);

		function HeaderCtrl($state, AuthService) {
			var self = this;

			/*
				HEADER Controller
			*/
			self.currentUser = AuthService.currentUser;

			self.logout = function () {
				AuthService.logout();
				$state.go('/app');
			};

			/*
				LOGIN Controller
			*/
			self.appName = AuthService.appName;
			self.error = $state.params.error;
			self.socialProviders = AuthService.getSocialProviders();

			self.authenticate = function () {
				self.error = null;
				self.success = null;

				if (self.newUser) {
					self.signup();
				} else {
					self.signin();
				}
			};

			self.signup = function () {
				var parameters = {
					company: self.company || ''
				};

				AuthService.signup(self.firstName, self.lastName, self.username, self.password, parameters)
					.then(
						function (response) {
							//check status of the sign in
							switch (response.data.currentStatus) {
							case 1: // The user is ready to sign in
								$state.go('/app');
								break;
							case 2: //The system is now waiting for the user to respond a verification email.
								self.success = 'Please check your email to continue';
								break;
							case 3: //The user signed up and is now waiting for an useristrator approval.
								self.success = 'Please wait for the useristrator to approve the sign up';
								break;
							}
						}, showError
					);
			};

			self.signin = function () {
				AuthService.signin(self.username, self.password)
					.then(
						function () {
							$state.go('/app');
						},
						showError
					);
			};

			function showError(error) {
				self.error = error && error.data || error.error_description || 'Unknown error from server';
			}

			function gotoTodos() {
				$state.go('/app');
			}

			self.socialSignin = function (provider) {
				self.newUser ?
					AuthService.socialSignup(provider.name)
					.then(gotoTodos, showError) :
					AuthService.socialSignin(provider.name)
					.then(gotoTodos, showError);
			};

		}

	}

)();