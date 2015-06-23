'use strict';
/**
 * app.wizard Module
 *
 * Description
 */
angular.module('app.wizard', [
    'wizard.type',
    'wizard.order',
    'wizard.event',
    'wizard.design',
    'wizard.summary'
  ])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider,
    $urlRouterProvider) {
    $stateProvider
      .state('wizard', {
        url: '/wizard',
        abstract: true,
        templateUrl: 'app/wizard/wizard.html',
        controller: 'WizardCtrl'
      });
    $urlRouterProvider.otherwise('/');
  }])
  .controller('WizardCtrl', ['$scope', '$rootScope', '$state',
    '$sessionStorage',
    function($scope, $rootScope, $state, $sessionStorage) {
      $scope.$storage = $sessionStorage;

      // default configuration wizard
      var wizardDefaults = {
          steps : [
            {
              id: 1,
              ref: 'type',
              label: 'Tequila',
              valid: true
            },
            {
              id: 2,
              ref: 'order',
              label: 'Pedido',
              valid: false
            },
            {
              id: 3,
              ref: 'event',
              label: 'Evento',
              valid: false
            },
            {
              id: 4,
              ref: 'design',
              label: 'Diseño',
              valid: false
            },
            {
              id: 5,
              ref: 'summary',
              label: 'Resumen',
              valid: false
            }],
          active: 0,
          len: 4
        };
      // ui-sref prefix
      var prefix = 'wizard.';

      // check if the wizard object exists in session
      if (!_.has($scope.$storage, 'wizard') ) {

        // the wizard is equal to an empty object
        $scope.$storage.wizard = {};

        // Assigns own enumerable properties of source objec
        // model wizard in session should be equal to wizardDefaults
        _.assign($scope.$storage.wizard , wizardDefaults);

        // bind wizard model to wizard model in session
        $scope.wizard = $scope.$storage.wizard;

      } else {
        // otherwise wizard model should be equal to last wizard model in session
        $scope.wizard = $scope.$storage.wizard;
      }

      $scope.nextStep = function () {
        var unlock = $scope.wizard.active + 1;
        $scope.wizard.steps[unlock].valid = true;
        $state.go(prefix + $scope.wizard.steps[unlock].ref);
      };

      $scope.resetRight = function() {
        for (var i = $scope.wizard.active; i < $scope.wizard.len; i++) {
          $scope.wizard.steps[i+1].valid = false;
        }
      };



      $rootScope.$on('$stateChangeStart',
      function(event, toState, toParams, fromState){


          var toRef = toState.name.replace('wizard.','');

          var toIndex = _.findIndex($scope.wizard.steps, function (step) {
            return step.ref === toRef;
          });

          if(toIndex!= -1) {
            var isUnlocked = $scope.wizard.steps[toIndex].valid;

            if (isUnlocked) {
              $scope.wizard.active = toIndex;
              $scope.resetRight();
            }else {
              $state.go(fromState.name);
            }
          }




      });

      // listen for changes in the steps
      $scope.$on('stepToWizard', function(event, step ){
        if( step.isValid){
          $scope.nextStep();
        }else {
          var unlock = $scope.wizard.active;
          $state.go(prefix + $scope.wizard.steps[unlock].ref);
        }
      });

    }
  ]);

'use strict';
/**
* wizard.type Module
*
* Description
*/
angular.module('wizard.type', [])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
      $stateProvider
        .state('wizard.type', {
          url: '/type',
          templateUrl: 'app/wizard/type.html',
          controller: 'TypeCtrl'
        });
      $urlRouterProvider.otherwise('/');
    }])
  .controller('TypeCtrl', ['$scope', '$sessionStorage', function($scope, $sessionStorage){
    $scope.$storage = $sessionStorage;
    $scope.stepIndex = 0;
    $scope.isValid = false;

    var callWizard = function () {
      $scope.$emit('stepToWizard', {
        index: $scope.stepIndex,
        isValid: $scope.isValid
      });
    };

    // activate validation
    callWizard();

    // check if the app object exists in session
    if (!_.has($scope.$storage, 'app')) {
      $scope.$storage.app = { order : {} };
      $scope.app = $scope.$storage.app;
    }else {
      // delete all an create again
      delete $scope.$storage.app;
      $scope.$storage.app = { order : {} };
      $scope.app = $scope.$storage.app;
    }

    $scope.typeSelected = $scope.app.order.type || null;

    $scope.selected = function (type) {
      $scope.typeSelected = type;
      $scope.app.order.type = $scope.typeSelected;
      $scope.isValid = true;

      callWizard();
    };

  }]);

'use strict';
/**
* wizard.summary Module
*
* Description
*/
angular.module('wizard.summary', [])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('wizard.summary', {
        url: '/summary',
        templateUrl: 'app/wizard/summary.html',
        controller: 'SummaryCtrl'
      });
    $urlRouterProvider.otherwise('/');
  }])
  .controller('SummaryCtrl', ['$scope','$state','$sessionStorage','$cookies','$window', 'baseUrl', 'Oscar' ,function($scope, $state, $sessionStorage, $cookies, $window, baseUrl, Oscar){
    $scope.order = $sessionStorage.app.order;
    $scope.labels = $scope.order.labels;
    $scope.cycle = $scope.order.cycle;
    $scope.isAllowed = true;

    $scope.continueDesigning = function () {
      if($scope.cycle.index < $scope.cycle.length) {
        $scope.cycle.index++;
        $scope.isAllowed = true;
      }else {
        $scope.cycle.index = $scope.cycle.length;
        $scope.isAllowed = false;
      }

      if (!$scope.isAllowed) {
        alert('Has completado el número de etiquetas disponibles.');
      }else {
        $state.go('wizard.design');
      }
    };

    if (!_.has($sessionStorage, 'app')) {
      $state.go('home');
    }

    var labels = [];
    $scope.renders = [];
    $scope.priceTotal = $scope.order.size.priceTotal;

    _.forEach($scope.labels, function (label) {
      if(!_.isEmpty(label.render)) {
        $scope.renders.push(label);
        labels.push(label.render.id);
      }
    });

    console.log($scope.renders);



    $scope.checkout = function () {


      console.log($cookies);
      var cartData = {
          csrfmiddlewaretoken: $cookies.get('csrftoken'),
          quantity: $scope.order.size.qty,
          labels : labels
      };

      var cartUrl = baseUrl.replace('dashboard/api/' , 'basket/add/') + $scope.order.size.product.id + '/';

      console.log(cartData);
      console.log(cartUrl);
      Oscar
        .send(cartUrl,  $.param(cartData) )
        .then(function(res) {
          delete  $sessionStorage.app;
          delete  $sessionStorage.wizard;
          $window.location.href = "/checkout";

        })
        .catch(function(err) {
          console.log(err);
        });
    }
  }]);

'use strict';
/**
* wizard.order Module
*
* Description
*/
angular.module('wizard.order', [])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('wizard.order', {
        url: '/order',
        templateUrl: 'app/wizard/order.html',
        controller: 'OrderCtrl'
      });
    $urlRouterProvider.otherwise('/');
  }])
  .controller('OrderCtrl', ['$scope','$sessionStorage', 'Products', 'ProductPrice',function($scope, $sessionStorage, Products, ProductPrice){
    $scope.stepIndex = 1;
    $scope.isValid = false;
    $scope.order = $sessionStorage.app.order;

    $scope.products = [];
    $scope.product = {};
    $scope.qty = null;
    $scope.productPrice = null;
    $scope.priceTotal = null;

    var getProducts = function (inSession) {
      Products
        .getAll($scope.order.type.id)
        .then(function (data) {
          $scope.products = data;
          if (inSession) {
            var productIndex = _.findIndex($scope.products, function (product){
              return product.id === $scope.order.size.product.id;
            });
            $scope.product = $scope.products[productIndex];
          }
        })
        .catch(function (err) {
          console.log('error', err);
        });
    };

    var validateStep = function () {
      if( !_.isUndefined($scope.product) && !_.isUndefined($scope.qty) && !_.isUndefined($scope.priceTotal) ) {
        $scope.isValid = true;
      }else {
        $scope.isValid = false;
      }
      return $scope.isValid;
    };

    // checar que existe en sesion el size
    if (_.has($scope.order, 'size') && !_.isEmpty($scope.order.size) ) {
      console.log('existe size en sesion');
      console.log($scope.order);
      $scope.qty = $scope.order.size.qty;
      getProducts(true);
    } else {
      // si no existe crear el objeto en sesion
      $scope.order.size = {};
      getProducts(false);
      $scope.qty = 1;
    }

    // observar cambios de product
    $scope.$watch('product', function(product) {
      // validate product value
      if (!_.isEmpty(product)) {
        // fetch the price of the selected product
        ProductPrice
          .get(product.id)
          .then(function(data) {
            $scope.productPrice = data[0];
            $scope.priceTotal = $scope.qty * $scope.productPrice['price_excl_tax'];
            validateStep();
          })
          .catch(function(err) {
            console.log(err);
          });
      }
    });

    // escuchar cambios de cantidad de cajas
    $scope.$watch('qty', function(newVal) {
      if (!_.isUndefined(newVal) && (newVal >= 1 )) {
        $scope.qty = newVal;
        if (! _.isEmpty( $scope.productPrice ) ) {
          $scope.priceTotal = $scope.qty * $scope.productPrice['price_excl_tax'];
        }
      }else {
        $scope.qty = 1;
      }

      validateStep();
    });

    var callWizard = function () {
      $scope.$emit('stepToWizard', {
        index: $scope.stepIndex,
        isValid: $scope.isValid
      });
    };

    callWizard();

    $scope.nextStep = function () {
      $scope.order.size = {
        qty : $scope.qty,
        priceTotal : $scope.priceTotal,
        product : $scope.product
      };

      $scope.order.cycle = {
        index: 1,
        length : $scope.qty * $scope.product.maxlabels
      };
      $scope.order.labels = [];
      for( var i = 0; i < $scope.qty * $scope.product.maxlabels; i++) {
        var label = {
          template : {},
          imgOriginal : {},
          render : {}
        };
        $scope.order.labels.push(label);

      }


      callWizard();
    };

  }]);

'use strict';
/**
* wizard.event Module
*
* Description
*/
angular.module('wizard.event', [])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('wizard.event', {
        url: '/event',
        templateUrl: 'app/wizard/events.html',
        controller: 'EventCtrl'
      });
    $urlRouterProvider.otherwise('/');
  }])
  .controller('EventCtrl', ['$scope', '$sessionStorage', 'Events', function($scope, $sessionStorage, Events){

    // first call to wizard to keep validate
    $scope.isValid = false;
    $scope.stepIndex = 2;
    $scope.order = $sessionStorage.app.order;

    $scope.events = [];

    var callWizard = function () {
        $scope.$emit('stepToWizard', {
        index: $scope.stepIndex,
        isValid: $scope.isValid
      });
    };
    callWizard();

    Events
      .get()
      .then(function(data) {
        $scope.events = data;
      })
      .catch(function(error) {
        console.log(error);
      });

    var labelsLen = $scope.order.cycle.length;
    var currentIndex = $scope.order.cycle.index;


    if ( _.has($scope.order, 'event')) {
      delete $scope.order.event;

    }

    if(!_.isEmpty($scope.order.labels[0].template || !_.isEmpty($scope.order.labels[0].imgOriginal) )) {

      for( var i = 0; i < $scope.order.labels.length; i++) {
        var cleanLabel = {
          template : {},
          imgOriginal : {},
          render : {}
        };
        $scope.order.labels[i]= cleanLabel;
      }

    }

    $scope.selectEvent = function ( event ) {
     if( ! _.isEmpty(event) ) {
      $scope.isValid = true;
      $scope.order.event = event;
     }
     callWizard();
    };

  }]);

'use strict';
/**
* wizard.design Module
*
* Description
*/
angular.module('wizard.design', [])
  .config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('wizard.design', {
        url: '/design',
        templateUrl: 'app/wizard/design.html',
        controller: 'DesignCtrl'
      });
    $urlRouterProvider.otherwise('/');
  }])
  .controller('DesignCtrl', ['$scope', '$sessionStorage', 'Templates','UploadImage','UploadLabel','DesignData',function($scope, $sessionStorage, Templates,UploadImage, UploadLabel, DesignData){

    // defaults
    $scope.stepIndex = 3;
    $scope.isValid = false;

    var callWizard = function () {
      $scope.$emit('stepToWizard', {
        index: $scope.stepIndex,
        isValid: $scope.isValid
      });
    };
    callWizard();

    // obtener orden de pedido
    $scope.order = $sessionStorage.app.order;

    $scope.params = {
      eventId : $scope.order.event.id,
      typeId : $scope.order.type.id
    };

    $scope.product = $scope.order.size.product;

    // obtener ciclo
    $scope.cycle = $scope.order.cycle;

    // obtener arreglo de etiquetas
    $scope.labels = $scope.order.labels;

    // helpe
    $scope.designData = DesignData;

    $scope.currentLabel = $scope.labels[$scope.cycle.index - 1];

    $scope.template = {};

    _.assign($scope.template, $scope.currentLabel.template);


    $scope.$on('thTemplateSelected', function (evt, tpl) {
      $scope.template = tpl;
      _.assign($scope.currentLabel.template, $scope.template);
    });

    $scope.imageUploaded = {};
    $scope.imageUploadedReady = false;

    _.assign($scope.imageUploaded, $scope.currentLabel.imgOriginal);

    if(!_.isEmpty($scope.imageUploaded)) {
      $scope.isValid = true;
    }

    $scope.$watch('files', function (newVal) {
      if(!_.isUndefined(newVal) && !_.isNull(newVal)) {
        var fd = new FormData();
        angular.forEach($scope.files, function (file) {
          fd.append('file', file);
        });

        UploadImage
          .send( fd )
          .then( function ( data ) {
            $scope.imageUploaded = data;
            _.assign($scope.currentLabel.imgOriginal, $scope.imageUploaded);
            $scope.isValid = true;
          })
          .catch(function ( error ) {
            console.log('error', error);
          });
      }
    });

    $scope.labelRender = undefined;
    $scope.labelBuild = false;

    $scope.processedLabel = {};
    _.assign($scope.processedLabel, $scope.currentLabel.render);

    if(!_.isEmpty($scope.processedLabel)) {
      $scope.currentLabel.render = {};
    }

    $scope.$watch('labelRender', function(newVal) {
      if (!_.isUndefined(newVal) && !_.isNull(newVal)) {

        // if this validation passes
        // creates the rendered tag data to be sent to the server
        var labelData = {
          uploadimage : $scope.imageUploaded.id,
          label : $scope.labelRender,
          name : '',
          template: $scope.template.id || null
        };


        // send labe to the server
        UploadLabel
          .send(labelData)
          .then(function(data) {
            if (!_.isEmpty(data)&& !( _.isNull(data) || _.isUndefined(data) ) ){
              $scope.processedLabel = data;
              _.assign($scope.currentLabel.render, $scope.processedLabel);

              $scope.isValid = true;
            }else {
              $scope.isValid = false;
            }

            callWizard();

          })
          .catch(function(err) {
            console.log(err);
          });
      }
    });

    $scope.fontStacks = [
      {
        'name': 'Arial',
        'stack': 'sans-a'
      },
      {
        'name' : 'Times New Roman',
        'stack' : 'serif-a'
      },
      {
        'name' : 'Comic Sans MS',
        'stack' : 'sans-b'
      },
      {
        'name' : 'Georgia',
        'stack' : 'serif-b'
      }
    ];
    $scope.designData.firstTl = 'Texto Primario';
    $scope.designData.secondTl = 'Texto Secundario';
    $scope.designData.font = $scope.fontStacks[0];

    $scope.nextStep = function () {
      $scope.labelBuild = true;

    };









  }]);

'use strict';
/**
 * app.widgets Module
 *
 * Description
 */
angular.module('app.widgets', []);

'use strict';
/**
 * app.widgets Module
 *
 * Description
 */
angular
  .module('app.widgets')
  .directive('thWizardStep', ['$compile', function ($compile) {
    // Runs during compile
    return {
      restrict: 'E',
      scope: {
        ref: '@stepRef',
        valid: '=stepValid',
        step: '=step'
      },
      template: [
        '<a class="step">',
        '<span class="step-dot">{{ step.id }}</span>',
        '<span class="step-label">{{ step.label }}</span>',
        '</a>'
      ].join(''),
      transclude: true,
      replace: true,
      link: function (scope, element) {
        $compile(element)(scope);
        //listening changes
        scope.$watch('valid', function (bool) {
          if (bool) {
            element.attr('ui-sref', scope.ref);
            element.attr('ui-sref-active', 'active');
          } else {
            element.removeAttr('ui-sref');
            element.removeAttr('href');
          }
          $compile(element)(scope);
        });
      }
    };
  }]);


'use strict';
/**
 * app.widgets Module
 *
 * Description
 */
angular.module('app.widgets')
  .directive('thTequilaCard', ['$parse',function($parse) {
    // Runs during compile
    return {
      restrict: 'A',
      scope: {
        type: '=thType',
        size: '@thSize',
        selected: '&thSelected'
      },
      transclude: true,
      templateUrl: 'app/widgets/thTequilaCard.html',
      link: function(scope) {

        scope.onSelectType = function(type) {
          scope.selected(type);
        };
      }
    };
  }]);

'use strict';
/**
 * app.widget Module
 *
 * Build a full back slider background
 */
angular
  .module('app.widgets')
  .directive('thTemplates', ['Templates', 'DesignData',function(Templates, DesignData){
    // Runs during compile
    return {
      scope: {
        params : '=thParams'
      }, // {} = isolate, true = child, false/undefined = no change
      controller: ["$scope", "$element", "$attrs", "$transclude", function($scope, $element, $attrs, $transclude) {

        $scope.templates = [];

        this.getTemplates = function () {
          Templates
            .get($scope.params)
            .then(function (data) {

              $scope.templates = data;
            })
            .catch(function(error) {
              console.log('error:', error);
            });
        };
        $scope.selectTemplate = function (template) {
          $scope.$emit('thTemplateSelected',template);
        };
      }],
      // require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
      restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
      // template: '',
      templateUrl: 'app/widgets/thTemplates.html',
      replace: true,
      transclude: true,
      // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
      link: function($scope, iElm, iAttrs, controller) {
        $scope.$watch('params', function (newVal) {
          if (!_.isEmpty(newVal)) {
            return controller.getTemplates();
          }
        });
      }
    };
  }]);

'use strict';
/**
 * app.widget Module
 *
 * Build a full back slider background
 */
angular
  .module('app.widgets')
  .directive('thBackSlider', ['$timeout', function($timeout){

    return {
      scope: {
        slides :'=thSource',
        options : '=thOptions'
      },
      templateUrl: 'app/widgets/thSlider.html',
      transclude: true,
      restrict: 'AE',
      replace: true,
      link: function(scope, element) {
        var superslides = null,
          defaults = {
            'slide_easing': 'easeInOutCubic',
            'slide_speed': 800,
            'pagination': true,
            'scrollable': true
          };

        if (!_.isEmpty(scope.options)) {
          angular.extend(defaults, scope.options);
        }

        scope.$watch('slides', function(newVal) {
          if ( !( _.isUndefined(newVal) || _.isNull(newVal)) ) {
            $timeout(function() {
              superslides = element.superslides(defaults);
            },500);
          }
        });
      }
    };
  }]);

'use strict';

angular.module('app.widgets')
  .directive('thSidebar', ['$parse', '$timeout', '$state','Types',function($parse, $timeout,$state,Types){
    // Runs during compile
    return {
      restrict: 'E',
      templateUrl: 'app/widgets/thSidebar.html',
      replace: true,
      transclude: true,
      link: function(scope, element, attrs) {
        scope.action =  $parse(attrs.thAction)(scope);
        scope.types = [];

        Types
          .getAll()
          .then(function(data) {
            scope.types = data;
          })
          .catch(function(err) {
            console.log(err);
          });
        var
          menu = element,
          triggerMmenu = menu.find('a.logo-image'),
          thin = menu.find('div.thin'),
          wide = menu.find('div.wide'),
          overlay = menu.find('div.background'),
          closeButton = menu.find('div.main-close-button'),
          timeline = new TimelineMax();

        timeline
          .to(thin, 0.1, { left: -50 })
          .to(overlay, 0.1, { display: 'block' })
          .to(overlay, 0.2, { opacity: 0.7 })
          .to(wide, 0.3, { left: 0})
          //.to(closeButton, 0.3, { left: 700 })
          .to(closeButton, 0.1, { display: 'block'})
          .to(closeButton, 0.3, { rotationY: '0deg' , force3D: true});

        timeline.stop();

        triggerMmenu.on('click', function (evt) {
          evt.preventDefault();
          scope.collapseMenu();
          return false;
        });

        scope.selected = function (type) {
          console.log(type);
          scope.collapseMenu();
        };

        scope.goHome = function() {
          $state.go('home');
          scope.collapseMenu();
        };

        scope.startCustom = function() {
          $state.go('wizard.type');
          scope.collapseMenu();
        };

        scope.collapseMenu = function () {
          $timeout(function() {
            if (scope.action === true) {
              timeline.play();
            }else {
              timeline.reverse();
            }
            scope.action = !scope.action;
            scope.$apply();
          },0);
        };
      }
    };
  }]);

'use strict';

angular.module('app.widgets')
  .directive('thLabelImage', [ 'DesignData' ,function(DesignData){
  // Runs during compile
  return {
    scope: {
      image : '=thImage',
      label : '=thLabel',
      build: '=thBuild'
    },
    templateUrl : 'app/widgets/thLabel.html',
    replace: true,
    link: function(scope, element) {
      scope.designData = DesignData;

      var isInitialized = false,
      label = element.parent();
      scope.$watch('image', function(newVal) {
        if (isInitialized) {
          return;
        } else if (!_.isUndefined(newVal) && !_.isEmpty(newVal)) {
          isInitialized = true;
        }
      });

      scope.$watch('build', function(newVal) {
        if (newVal) {
          html2canvas(label, {
            onrendered: function(canvas){
             scope.$apply(function() {
              scope.label = canvas.toDataURL();
             });
            }
          });
        }
      });
    }
  };
}]);

'use strict';

angular.module('app.widgets')
  .directive('thImageTransform', ['$timeout','$window', '$document', 'DesignData', function($timeout, $window, $document, DesignData) {
    // Runs during compile

    return {
      scope: {
        image: '=thImage'
      },
      restrict: 'E',
      templateUrl : 'app/widgets/thImageTransform.html',
      replace: true,
      transclude: true,
      link: function(scope, element) {
        scope.designData = DesignData;
        var
          isInitialized = false,
          isTouchSupported = ('ontouchstart' in $window) || ($window.navigator.msPointerEnable) ? true : false,
          events = (isTouchSupported ? {
            start: 'touchstart',
            end: 'touchend',
            move: 'touchmove'
          } : {
            start: 'mousedown',
            end: 'mouseup',
            move: 'mousemove'
          }),
          scaleImage = 315/315,

          getPosition = function(evt) {
            var posX = 0,
              posY = 0;

            if (evt.originalEvent.targetTouches) {
              posX = evt.originalEvent.targetTouches[0].pageX;
              posY = evt.originalEvent.targetTouches[0].pageY;
            } else if (evt.pageX || evt.pageY) {
              posX = evt.pageX;
              posY = evt.pageY;
            } else if (evt.clientX || evt.clientY) {
              posX = evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
              posY = evt.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }

            return {
              x: posX,
              y: posY
            };
          },
          clamp = function(value, min, max) {
            return Math.min(Math.max(value, min), max);
          };

        var transform = {
          init: function() {
            this.cache();
            return this;
          },
          reload: function() {
            var self = this;
            self.unbind();
            self.cache();
          },
          // cache the elements to work
          cache: function() {
            var self = this;
            self.dragArea = element.find('.tfm-area');
            self.dragImage = element.find('.tfm-image');
            self.dragMask = element.find('.tfm-mask');
            self.dragImage.css({
              'width': 'auto',
              'top': 0,
              'left': 0
            });
            self.initVectors();
            self.centerImage();
            this.bind();
          },
          centerImage: function() {
            var self = this;

            self.dragImage.one('load', function() {

              var
                rect = self.rect($(this)),
                mask = self.rect(self.dragMask),
                ratio = rect.width / rect.height,
                direction = (ratio > 1) ? 'horizontal' : 'vertical',
                newWidth = 0,
                newHeight = 0;

              if (direction === 'vertical') {
                newWidth = mask.width * 1.2;
                newHeight = newWidth / ratio;

                $(this).width(newWidth);
                $(this).height(newHeight);

              } else if (direction === 'horizontal') {
                newHeight = mask.height * 1.2;
                newWidth = newHeight * ratio;

                $(this).width(newWidth);
                $(this).height(newHeight);
              }

              var
                centerX = (mask.width - $(this).width()) * 0.5,
                centerY = (mask.height - $(this).height()) * 0.5;

              transform.vector.imgInit.x = centerX;
              transform.vector.imgInit.y = centerY;

              transform.imgRect = {
                width : newWidth,
                height: newHeight,
                top: centerY,
                left: centerX
              };

             scope.$apply(function() {
                scope.designData.transform.left = transform.imgRect.left * scaleImage;
                scope.designData.transform.top = transform.imgRect.top * scaleImage;
                scope.designData.transform.width = transform.imgRect.width * scaleImage;
                scope.designData.transform.height = transform.imgRect.height * scaleImage;
              });

              $(this).css({
                left: centerX,
                top: centerY
              });

            }).each(function() {
              if (this.complete) {
                $(this).load();
              }
            });
          },
          initVectors: function() {
            var self = this;

            self.vector = {
              init: { x: 0,    y: 0},
              current: { x: 0, y: 0},
              imgInit: { x: 0, y: 0},
              imgDest: { x: 0, y: 0}
            };

          },
          scale: function(range){
            console.log(range);
            var self = this,
              nw = range.value * self.imgRect.width, //clamp( ( range.value * self.imgRect.width )  , self.imgRect.width, ( self.imgRect.width * range.max )),
              nh = nw * self.imgRect.height / self.imgRect.width,
              ot = self.vector.imgInit.y,
              ol = self.vector.imgInit.x,
              s = range.value / range.lastValue,
              nt = s * ot + (1 - s) * self.dragMask.outerHeight(true) / 2,
              nl = s * ol + (1 - s) * self.dragMask.outerWidth(true) / 2;

              //nt = clamp( nt , self.dragMask.outerHeight(true) - nh, 0);
              //nl = clamp( nl , self.dragMask.outerWidth(true) - nw, 0);

              self.dragImage.css({
                width : nw,
                height : nh,
                top: nt,
                left: nl
              });
              scope.$apply(function() {
                scope.designData.transform.left = nl * scaleImage;
                scope.designData.transform.top = nt * scaleImage;
                scope.designData.transform.width = nw * scaleImage;
                scope.designData.transform.height = nh * scaleImage;
              });
          },
          lastPosition: function(){
            var
              self = this,
              imgPosition = self.dragImage.position();

            self.vector.imgInit.x = imgPosition.left;
            self.vector.imgInit.y = imgPosition.top;
          },
          bind: function() {
            var self = this;
            self.dragArea.on(events.start, self.onStartHandler);
          },
          onStartHandler: function(evt){
            this.allowUp = (this.scrollTop > 0);
            this.allowDown = (this.scrollTop < this.scrollHeight - this.clientHeight);
            this.prevTop = null;
            this.prevBot = null;
            this.lastY = evt.pageY;

            transform.vector.init.x = getPosition(evt).x;
            transform.vector.init.y = getPosition(evt).y;

            $document.on(events.end, transform.onEndHandler);
            $document.on(events.move, transform.onMoveHandler);

            transform.dragImage.on('dragstart', function (evt) {
              evt.preventDefault();
            });
          },
          onEndHandler: function(evt){
            $document.off(events.move, transform.onMoveHandler);
            $document.off(events.end, transform.onEndHandler);

          },
          onMoveHandler: function(evt){
            var up = (evt.pageY > this.lastY), down = !up;
            this.lastY = evt.pageY;

            if ((up && this.allowUp) || (down && this.allowDown)) evt.stopPropagation();
            else evt.preventDefault();

            var
              mouse = getPosition(evt),
              bound = {
                //top: transform.dragMask.outerHeight() - transform.dragImage.height(),
                top: -transform.dragImage.height(),
                //left : transform.dragMask.outerWidth() - transform.dragImage.width(),
                left : - transform.dragImage.width(),
                right : transform.dragMask.outerWidth(),
                bottom : transform.dragMask.outerHeight()
              };

              transform.vector.current.x = mouse.x;
              transform.vector.current.y = mouse.y;
              var
                dx = transform.vector.current.x - transform.vector.init.x,
                dy = transform.vector.current.y - transform.vector.init.y,
                nx = clamp(transform.vector.imgInit.x + dx , bound.left, bound.right),
                ny = clamp(transform.vector.imgInit.y + dy , bound.top, bound.bottom);

              transform.vector.imgDest.x = nx;
              transform.vector.imgDest.y = ny;

              transform.dragImage.css({
                left : transform.vector.imgDest.x,
                top : transform.vector.imgDest.y
              });

              transform.vector.init.x = transform.vector.current.x;
              transform.vector.init.y = transform.vector.current.y;

              transform.vector.imgInit.x = transform.vector.imgDest.x;
              transform.vector.imgInit.y = transform.vector.imgDest.y;



              scope.$apply(function() {
                scope.designData.transform.left = transform.vector.imgDest.x * scaleImage;
                scope.designData.transform.top = transform.vector.imgDest.y * scaleImage;
              });
          },
          unbind: function() {
          },
          rect: function(el) {
            return el[0].getBoundingClientRect();
          }
        };

        var range = {
          init: function() {
            var self = this;
            // settings default
            self.data = {
              min: 1/3,
              max : 3,
              value : 1,
              lastValue : 1
            };

            this.cache();
            return this;
          },
          reload: function() {
            var self = this;
            self.unbind();
            self.cache();
          },
          cache: function() {
            var self = this;

            self.thumb = element.find('.tfm-range-thumb');
            self.track = element.find('.tfm-range-track');

            var left = ( ( self.track.width() - self.thumb.width() ) /( self.data.max - self.data.min )   * (self.data.value - self.data.min ) );

            // reset styles
            self.thumb.css({
              top: 0,
              left: left
            });

            // reset default values
            self.data.value = 1;
            self.data.lastValue  = 1;

            self.bound = {
              min : self.track.position().left,
              max : self.track.width() - self.thumb.width()
            };


            self.offsetX = 0;

            self.bind();

          },
          bind: function() {
            var self = this;
            self.thumb.on(events.start, self.onStartHandler);
          },
          onStartHandler: function(evt){
            evt.preventDefault();
            range.offsetX = getPosition(evt).x - range.thumb.position().left;

            $document.on(events.end, range.onEndHandler);
            $document.on(events.move, range.onMoveHandler);
          },
          onEndHandler: function(evt){
            $document.off(events.end, range.onEndHandler);
            $document.off(events.move, range.onMoveHandler);

            range.data.lastValue = range.data.value;
            transform.lastPosition();
          },
          onMoveHandler: function(evt){
             var
              mouse = getPosition(evt),
              proportion = (range.data.max - range.data.min) / (range.bound.max - range.bound.min),
              point = ( mouse.x - range.offsetX ),
              newPoint = clamp(point, range.bound.min, range.bound.max),
              value = (point - range.bound.min) * proportion + range.data.min;

              range.thumb.css({ left : newPoint });

              value = clamp( value, range.data.min, range.data.max);
              range.data.value = value;

            transform.scale(range.data);
          },
          unbind: function() {
            range.thumb.off(events.start, range.onStartHandler);
          }
        };

        // listen if a new image has been uploaded
        scope.$watch('image', function(newVal) {
          if (isInitialized) {
            transform.reload();
            range.reload();
          } else if (!_.isUndefined(newVal) && !_.isEmpty(newVal)) {
            $timeout(function () {
              transform.init();
              range.init();
              isInitialized = true;
            },1000);

          }
        });
      }
    };
  }]);

'use strict';
/**
 * app.widget Module
 *
 * Build a full back slider background
 */
angular
  .module('app.widgets')
  .directive('thFileUpload',['$parse',function ($parse) {
    // Runs during compile
      return {
    restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
    link: function(scope, element, attrs) {
      element.bind('change', function() {
        $parse(attrs.thFileUpload)
          .assign(scope, element[0].files);
        scope.$apply();
      });
    }
  };
  }]);

'use strict';
/**
* Services Module
*
* Description
*/
angular
  .module('app.services', [])
  .constant('baseUrl', 'http://maravatio.haushaus.mx/dashboard/api/')
  .constant('token', 'Token 61e7de5eae825fe98dbb8e1ad714a97d4fc090f8');

'use strict';

angular.module('app.services')
  .factory('UploadImage', ['$http', '$q', 'baseUrl', 'token',function($http, $q, baseUrl, token){
    return {
      send: function(fd) {
      var defered = $q.defer(),
        promise = defered.promise,
        fragmentUrl = 'uploadimages/';

      $http
        .post(baseUrl + fragmentUrl, fd, {
          headers: {
            'Content-Type': undefined,
            'Authorization': token
          },
          transformRequest: angular.identify
        })
        .success(function(data) {
          defered.resolve(data);
        })
        .error(function(err) {
          defered.reject(err);
        });

      return promise;
    }
    };
  }]);

'use strict';
/**
* app.services Module
*
* Description
*/
angular.module('app.services')
  .factory('Types', ['$http','$q', 'baseUrl', function($http, $q, baseUrl){
    return {
      getAll: function(){
        var defered = $q.defer(),
          promise = defered.promise,
          fragmentUrl = 'types/';

        $http.get(baseUrl + fragmentUrl)
          .success(function (data){
            defered.resolve(data);
          })
          .error(function (err) {
            defered.reject(err);
          });
        return promise;
      }
    };
  }]);

'use strict';

/**
* app.services Module
*
* Description
*/
angular.module('app.services')
/**
 * @ngdoc service
 * @name Templates
 * @description
 * # Templates
 * Service in the app.services
 */
 .factory('Templates', ['$http', '$q', 'baseUrl', function($http, $q, baseUrl) {
  // Public API here
  return {
    get: function(params) {
      $http.defaults.withCredentials = false;
      var defered = $q.defer(),
        promise = defered.promise,
        url = baseUrl + 'events/' + params.eventId + '/templates/?q=' + params.typeId;

      $http.get(url)
        .success(function(data) {
          defered.resolve(data);
        })
        .error(function(err) {
          defered.reject(err);
        });

      return promise;
    }
  };
}]);

'use strict';

/**
* app.services Module
*
* Description
*/
angular.module('app.services')
/**
 * @ngdoc service
 * @name Products
 * @description
 * # Products
 * Service in the app.services
 */
.factory('Products', ['$http', '$q', 'baseUrl', function($http, $q, baseUrl) {
  // Public API here
  return {
    getAll: function(typeId) {
      $http.defaults.withCredentials = false;
      var defered = $q.defer(),
        promise = defered.promise,
        fragmentUrl = '/products/';

      $http.get(baseUrl + 'types/' + typeId + fragmentUrl)
        .success(function(data) {
          defered.resolve(data);
        })
        .error(function(err) {
          defered.reject(err);
        });

      return promise;
    },
    getById : function(productId) {
      var defered = $q.defer(),
        promise = defered.promise,
        fragmentUrl = 'products/';

      $http.get(baseUrl + fragmentUrl + productId)
        .success(function(data) {
          defered.resolve(data);
        })
        .error(function(err) {
          defered.reject(err);
        });

      return promise;
    }
  };
}]);

'use strict';

/**
* app.services Module
*
* Description
*/
angular.module('app.services')
/**
 * @ngdoc service
 * @name ProductPrice
 * @description
 * # ProductPrice
 * Service in the app.services
 */
.factory('ProductPrice', ['$http', '$q', 'baseUrl', function($http, $q, baseUrl) {
  // Public API here

  return {
    get: function(productId) {
      $http.defaults.withCredentials = false;

      var defered = $q.defer(),
        promise = defered.promise,
        fragmentUrl = 'products/';

      $http.get(baseUrl + fragmentUrl + productId + '/stockrecords')
        .success(function(data) {
          defered.resolve(data);
        })
        .error(function(err) {
          defered.reject(err);
        });

      return promise;
    }
  };
}]);

'use strict';

angular.module('app.services')
  .factory('Oscar', ['$http',  '$q', function($http,  $q){
    return {
      send : function (url, data) {
        console.log('sevice says ' + typeof data);
        var defered = $q.defer(),
          promise = defered.promise;

        $http
          .post(url, data , {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            transformRequest: angular.identify
          })
          .success(function(data) {
            defered.resolve(data);
          })
          .error(function(err) {
            defered.reject(err);
          });
        console.log($http.defaults);
        return promise;
      }
    };
  }]);


'use strict';

/**
* app.services Module
*
* Description
*/
angular.module('app.services')
/**
 * @ngdoc service
 * @name Event
 * @description
 * # Event
 * Service in the app.services
 */
.factory('Events', ['$http', '$q', 'baseUrl', function($http, $q, baseUrl) {
  // Public API here

  return {
    get: function() {
      $http.defaults.withCredentials = false;
      var defered = $q.defer(),
        promise = defered.promise,
        fragmentUrl = 'events/';

      $http.get(baseUrl + fragmentUrl)
        .success(function(data) {
          defered.resolve(data);
        })
        .error(function(err) {
          defered.reject(err);
        });

      return promise;
    }
  };
}]);

'use strict';
angular.module('app.services')
  .factory('DesignData', [function(){
    return {
      transform : {}
    };
  }]);

'use strict';

angular.module('app.services')
  .factory('UploadLabel', ['$http', '$q','baseUrl', 'token', function($http, $q, baseUrl, token){
    return {
      send : function (data) {

        var defered = $q.defer(),
          promise = defered.promise,
          fragmentUrl = 'labels/';

        $http
          .post(baseUrl + fragmentUrl, data , {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token
            }
          })
          .success(function(data) {
            defered.resolve(data);
          })
          .error(function(err) {
            defered.reject(err);
          });

        return promise;
      }
    };
  }]);

'use strict';
/**
* app.home Module
*
* Description
*/
angular.module('app.home', [])
  .config(['$stateProvider','$urlRouterProvider',function($stateProvider,$urlRouterProvider) {
    $stateProvider
      .state('home',{
        url : '/',
        templateUrl: 'app/home/home.html',
        controller : 'HomeCtrl'
      });
    $urlRouterProvider.otherwise('/');
  }])
  .controller('HomeCtrl', ['$scope','$sessionStorage' ,function($scope,$sessionStorage){

    if (_.has($sessionStorage, 'wizard') && _.has($sessionStorage, 'app') ) {
      delete $sessionStorage.wizard;
      delete $sessionStorage.app;
    }

    $scope.slides = [{
      title: 'Tu Momento Especial',
      caption: 'Porque siempre hay esa canción, aroma, lugar que lo revive.',
      src: 'static/assets/images/slide-1.jpg',
      action: 'Comience ahora',
      position: 'top-left'
    }, {
      title: 'Transfórmalo',
      caption: 'Esa fotografía tomada por el corazón.',
      src: 'static/assets/images/slide-2.jpg',
      action: 'No esperes más',
      position: 'top-left'
    }, {
      title: 'A un Recuerdo Eterno',
      caption: 'Conservar es asegurar que no se olvide.',
      src: 'static/assets/images/slide-3.jpg',
      action: 'Envíe su pedido hoy',
      position: 'top-left'
    }];

    $scope.sliderOpts = {
      'inherit_width_from' : '.fixed-left',
      'inherit_height_from' : '.fixed-left',
      'play' : 6000,
      'pagination' : false
    };

  }]);

/**
* app.core Module
*
* Description
*/
angular.module('app.core', [
  'ui.router',
  'ngSanitize',
  'ngCookies',
  'ngStorage',
  'angular-loading-bar'
]);

'use strict';

angular.module('app', [
  'app.core',
  'app.services',
  'app.home',
  'app.wizard',
  'app.widgets'
]);

angular.module("app").run(["$templateCache", function($templateCache) {$templateCache.put("app/home/home.html","<div class=\"fixed-left\"><th-back-slider th-source=\"slides\" th-options=\"sliderOpts\"></th-back-slider></div><div class=\"rel-right\"><div class=\"about\"><div class=\"about-header\"><div class=\"logo\"><a ui-sref=\"home\" class=\"logo-image\">Tequila Hacienda Maravatio</a></div></div><div class=\"about-txt\"><hr><p>En Tequila Hacienda Maravatio reconocemos que existen momentos inolvidables, cosas inexplicables y personas incomparables aunado a ello queremos que estos recuerdos perduren para siempre.</p><p>Tenemos una manera única, genial y especial para que esto sea posible, ahora puedes personalizar la etiqueta de la botella de tu tequila sea blanco o reposado.</p><hr><h4 class=\"title\">Los pasos son muy sencillos</h4><span class=\"divider\"></span><ul><li>El primero es la selección del tipo de tequila.</li><li>Segundo determinar presentación y el número de botellas de tequila que requieres.</li><li>Tercero personalizar tu etiqueta en base al evento que tendras.</li><li>Por ultimo seleccionar tu forma de pago</li></ul><div class=\"text-center\"><a ui-sref=\"wizard.type\" class=\"btn btn-primary\">Personaliza ahora</a></div></div></div></div>");
$templateCache.put("app/widgets/thImageTransform.html","<div class=\"th-image-transform\"><hr><div class=\"tfm-wrap\"><label class=\"th-label\">Arrastra para mover la imagen</label><div class=\"tfm\"><div class=\"tfm-wrap\"><div class=\"tfm-area\"></div><div class=\"tfm-inner\"><div class=\"tfm-container\"><div class=\"tfm-mask\"><img ng-src=\"{{ image.file}}\" class=\"tfm-image\"></div><img ng-src=\"{{ image.file}}\" class=\"tfm-image tfm-image-overlay\"></div></div></div><label class=\"text-center th-label\">Aumenta o Reduce el tamaño de la imagen</label><div class=\"tfm-range\"><div class=\"tfm-range-thumb\"></div><div class=\"tfm-range-track\"></div></div></div></div></div>");
$templateCache.put("app/widgets/thLabel.html","<div class=\"label-final-image\"><div class=\"label-final-mask\"><img ng-src=\"{{ image.file }}\" ng-style=\"designData.transform\" class=\"label-final-img\" ng-class=\"designData.filter\"></div></div>");
$templateCache.put("app/widgets/thSidebar.html","<div class=\"main-menu\" ng-class=\"{ \'collapsed\' : action }\"><div class=\"background\"></div><div class=\"thin\"><div class=\"logo\"><a class=\"logo-image\" title=\"Abrir Menú Principal\">Tequila Hacienda Maravatio</a></div><div class=\"sign-in\"><a href=\"/accounts/profile\" title=\"Iniciar Sesión\"><span class=\"sign-in-icon\"></span></a></div></div><div class=\"wide\"><div class=\"nav-centerer\"><div class=\"logo\"><span ng-click=\"goHome()\" class=\"logo-image\">Tequila Hacienda Maravatio</span></div><span class=\"title\">Puedes personalizar los siguientes tipos de tequila.</span><ul class=\"list-unstyled type-list\"><li ng-repeat=\"type in types\" class=\"type-list-item\"><img ng-src=\"{{ type.bimage }}\" alt=\"{{ type.name }}\" height=\"200\"><br><label class=\"th-label\">{{ type.name }}</label></li></ul></div><div class=\"tequila-finder\"><span class=\"title\">Haz que ese momento perdure por siempre.</span> <button class=\"btn btn-primary\" ng-click=\"startCustom();\">Perzonaliza Ahora</button></div><div class=\"footer\"><ul class=\"list-unstyled\"><li><a href=\"\">Tienda</a></li><li><a href=\"\">Contactanos</a></li><li><a href=\"\">Términos y Condiciones</a></li><li><a href=\"\">Desarrollado por MuchaWeb</a></li></ul></div></div><div class=\"main-close-button-wrapper\"><div class=\"main-close-button\"><a href=\"#\" class=\"logo-image\">Tequila Hacienda Maravatio</a></div></div></div>");
$templateCache.put("app/widgets/thSlider.html","<div id=\"slides\" class=\"th-slides\"><ul class=\"slides-container\"><li ng-repeat=\"slide in slides\" class=\"th-slide\"><div class=\"th-slide-caption\" ng-class=\"slide.position\"><h3 class=\"th-slide-caption-title\">{{ slide.title }}</h3><p class=\"th-slide-caption-text\">{{ slide.caption }}</p><a ui-sref=\"wizard.type\" class=\"btn btn-primary\">{{slide.action}}</a></div><img ng-src=\"{{ slide.src }}\" alt=\"{{ slide.name }}\" width=\"960\" height=\"850\"></li></ul><nav class=\"slides-navigation th-slides-nav\"><a href=\"#\" class=\"next th-slides-nav-item\">Siguiente</a> <a href=\"#\" class=\"prev th-slides-nav-item\">Anterior</a></nav></div>");
$templateCache.put("app/widgets/thTemplates.html","<div class=\"th-templates\"><label class=\"th-label\"><strong>1</strong>Seleccionar una plantilla (opcional)</label><div class=\"th-templates-wrap\"><ul class=\"list-unstyled th-templates-list\"><li ng-repeat=\"tpl in templates\" class=\"th-template-item\"><div class=\"template-block\" ng-click=\"selectTemplate(tpl);\"><img ng-src=\"{{ tpl.timage}}\" alt=\"\" height=\"120\"></div></li></ul></div></div>");
$templateCache.put("app/widgets/thTequilaCard.html","<div class=\"th-card\"><div class=\"th-card-panel\" ng-click=\"onSelectType(type);\"><div class=\"th-card-body\"><img ng-src=\"{{ type.bimage }}\" height=\"{{ size }}\"><h2 class=\"th-card-name\">{{ type.name }}</h2></div></div></div>");
$templateCache.put("app/wizard/design.html","<div class=\"wizard-view wizard-view-design\"><header class=\"wizard-view-header\"><h3 class=\"title\">Diseña tu etiqueta</h3></header><div class=\"wizard-view-container\"><div class=\"fixed-left\"><div class=\"label-final\"><div class=\"label-final-txt label-final-txt-first\"><span class=\"ff-stack\" ng-class=\"designData.font.stack\">{{ designData.firstTl}}</span></div><div class=\"label-final-template\"><img ng-src=\"{{ template.timage }}\" alt=\"\"></div><th-label-image th-image=\"imageUploaded\" th-label=\"labelRender\" th-build=\"labelBuild\"></th-label-image><div class=\"label-final-txt label-final-txt-second\"><span class=\"ff-stack\" ng-class=\"designData.font.stack\">{{ designData.secondTl}}</span></div><div class=\"label-final-base\"><img ng-src=\"{{ product.img_tag }}\" alt=\"\"></div></div></div><div class=\"rel-right\"><th-templates th-params=\"params\" class=\"th-template\"></th-templates><div class=\"th-upload-image\"><label class=\"th-label\"><strong>2</strong>Subir fotografía</label> <input type=\"file\" th-file-upload=\"files\" class=\"form-control\"><th-image-transform th-image=\"imageUploaded\" ng-show=\"isValid\"></th-image-transform><div class=\"th-image-filters\" ng-show=\"isValid\"><hr><label class=\"th-label\">Aplicar filtros a tu fotografía (opcional)</label><form><div class=\"th-filter-item\"><img src=\"static/assets/images/f-bn.png\" alt=\"Filtro Blanco y Negro\"> <span class=\"th-filter-control\"><input type=\"radio\" name=\"filter\" ng-model=\"designData.filter\" value=\"blackwhite\"> Blanco &amp;Negro</span></div><div class=\"th-filter-item\"><img src=\"static/assets/images/f-sepia.png\" alt=\"Filtro Sepia\"> <span class=\"th-filter-control\"><input type=\"radio\" name=\"filter\" ng-model=\"designData.filter\" value=\"sepia\"> Sepia</span></div><div class=\"th-filter-item\"><img src=\"static/assets/images/f-no-filter.png\" alt=\"Sin filtro\"> <span class=\"th-filter-control\"><input type=\"radio\" name=\"filter\" ng-model=\"designData.filter\" value=\"no-filter\"> Sin filtros</span></div></form></div></div><div class=\"th-headlines\"><label class=\"th-label\"><strong>3</strong> Personalizar textos</label><form class=\"form-horizontal\"><div class=\"form-group\"><label class=\"col-sm-2 control-label\">Titulo Primario:</label><div class=\"col-sm-10\"><input type=\"text\" class=\"form-control\" ng-model=\"designData.firstTl\"></div></div><div class=\"form-group\"><label class=\"col-sm-2 control-label\">Titulo Secundario:</label><div class=\"col-sm-10\"><input type=\"text\" class=\"form-control\" ng-model=\"designData.secondTl\"></div></div><div class=\"form-group\"><label class=\"col-sm-2 control-label\">Fuente:</label><div class=\"col-sm-10\"><select class=\"form-control\" ng-model=\"designData.font\" ng-options=\"font as font.name for font in fontStacks\"><option value=\"\">Seleccione</option></select></div></div></form></div><hr><button class=\"btn btn-primary\" ng-disabled=\"!isValid\" ng-click=\"nextStep()\">Siguiente</button></div></div></div><svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"greyscale\"><fecolormatrix type=\"matrix\" values=\"0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0\"></fecolormatrix></filter></svg><svg version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"old-timey\"><fecolormatrix values=\"0.14 0.45 0.05 0 0 0.12 0.39 0.04 0 0 0.08 0.28 0.03 0 0 0 0 0 1 0\"></fecolormatrix></filter></svg>");
$templateCache.put("app/wizard/events.html","<div class=\"wizard-view wizard-view-events\"><header class=\"wizard-view-header\"><h3 class=\"title\">¿Qué estamos celebrando?</h3></header><div class=\"wizard-view-container\"><ul class=\"list-unstyled event-list\"><li ng-repeat=\"event in events\" class=\"event-list-item\"><div class=\"event-block\" ng-click=\"selectEvent(event)\"><figure class=\"event-circle\"><img ng-src=\"{{ event.eventimg}}\" alt=\"\"></figure><span class=\"event-name\">{{ event.name }}</span></div></li></ul></div></div>");
$templateCache.put("app/wizard/order.html","<div class=\"wizard-view wizard-view-order\"><header class=\"wizard-view-header\"><h3 class=\"title\">Elije el tamaño de tu botella y numero de cajas.</h3></header><div class=\"wizard-view-container\"><div class=\"fixed-left\"><figure class=\"bottle-fig text-center\"><img src=\"static/assets/images/ghots-bottle.png\" height=\"500\" ng-show=\"!product.img_zoom_size\"> <img ng-src=\"{{ product.img_zoom_size }}\" height=\"500\"></figure></div><div class=\"rel-right\"><div class=\"order-config\"><header class=\"order-config-header\"><h1 class=\"order-product-title\" ng-bind=\"product.title\"></h1><p class=\"order-product-txt\" ng-bind-html=\"product.description\"></p></header><div class=\"order-config-size\"><hr><label class=\"th-label\">Presentación</label><select ng-model=\"product\" ng-options=\"product as product.bottlesize for product in products | orderBy:\'id\'\" class=\"form-control product-size-select\"><option value=\"\">Seleccione</option></select><hr></div><div class=\"order-config-qty\"><label class=\"th-label\">Numero de cajas</label> <input type=\"text\" class=\"form-control product-qty\" ng-model=\"qty\" name=\"box\" ng-disabled=\"!product.id\"><hr></div><div class=\"order-config-price\" ng-show=\"priceTotal\"><label class=\"th-label\">Precio</label> <span class=\"product-price\">$ {{ priceTotal }} {{ productPrice.price_currency }}</span><hr></div><button class=\"btn btn-primary\" ng-disabled=\"!isValid\" ng-click=\"nextStep()\">Siguiente</button></div></div></div></div>");
$templateCache.put("app/wizard/summary.html","<div class=\"wizard-view wizard-view-summary\"><header class=\"wizard-view-header\"><h3 class=\"title\">Resumen</h3></header><div class=\"wizard-view-container\"><div class=\"th-summary\"><label class=\"th-label text-center\">Estás a muy poco de tener tu pedido personalizado es momento de revisar si lo seleccionado previamente es correcto, si no, puedes retroceder y modificarlo.</label><ul class=\"list-unstyled th-summary-renders\"><li ng-repeat=\"labelRender in renders\"><img ng-src=\"{{ labelRender.render.label }}\" alt=\"\" height=\"300\"></li></ul><div class=\"th-summary-price\"><hr><span><strong>Total:</strong>$ {{ priceTotal}} MXN</span><hr></div><div class=\"clearfix\"><button class=\"btn btn-primary\" ng-disabled=\"!isAllowed\" ng-click=\"continueDesigning();\">Continuar personalizando</button> <button class=\"btn btn-primary pull-right\" ng-click=\"checkout()\">Pasar a pagar</button></div></div></div></div>");
$templateCache.put("app/wizard/type.html","<div class=\"wizard-view wizard-view-types\"><header class=\"wizard-view-header\"><h3 class=\"title\">Selecciona el tequila de tu preferencia</h3></header><div class=\"wizard-view-container\"><ul class=\"list-unstyled type-list\"><li ng-repeat=\"type in types\" th-tequila-card=\"\" th-type=\"type\" th-size=\"400\" th-selected=\"selected(type)\" class=\"type-list-item\"></li></ul></div></div>");
$templateCache.put("app/wizard/wizard.html","<div class=\"wizard\"><header class=\"wizard-header\"><nav class=\"nav-steps\"><ul class=\"list-unstyled steps-list\"><li class=\"steps-list-item\" ng-repeat=\"step in wizard.steps\"><th-wizard-step step=\"step\" step-valid=\"step.valid\" step-ref=\"wizard.{{ step.ref }}\"></th-wizard-step></li></ul></nav></header><div class=\"wizard-container\" ui-view=\"\"></div></div>");}]);