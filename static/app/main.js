/**
 * Created by xiaobai on 14-6-23.
 */

vim = angular.module('vim', ['ngRoute'], function ($interpolateProvider) {
    $interpolateProvider.startSymbol('<{');
    $interpolateProvider.endSymbol('}>');
});


//配置路由
vim.config(function ($routeProvider,$locationProvider) {
    $locationProvider.html5Mode(true);
    $routeProvider.
        when('/', {templateUrl: 'http://vimcn.qiniudn.com/view/main.html', controller: MainController}).
        when('/Help', {templateUrl: 'http://vimcn.qiniudn.com/view/help.html', controller: HelpController}).
        when('/Us', {templateUrl: 'http://vimcn.qiniudn.com/view/us.html', controller: HelpController}).
        otherwise({redirectTo: '/'});
}).config(function ($httpProvider) {
    $httpProvider.defaults.transformRequest = function (obj) {
        var str = [];
        for (var p in obj) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
        return str.join("&");
    }
    $httpProvider.defaults.headers.post = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
}).config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        'http://vimcn.qiniudn.com/**',
    ]);
});

MainController = function ($scope,$route, $routeParams, $location, $http,$window) {

    $scope.onFileSelect = function ($files) {
        $scope.File = $files[0];
        if ($scope.File == undefined) return;
        if (!helper.support) {
            alert("不支持HTML5！喵,换浏览器");
            return;
        }
        if (!helper.isFile($scope.File)){
            alert("不是文件,这是什么呢"+$scope.File);
            return;
        }
        if (helper.isImage($scope.File)){
            var reader = new FileReader();
            reader.onload = onLoadFile;
            reader.readAsDataURL($scope.File);
            $("#sgnpCtn").css({"width":"1080px","marginLeft":"-550px","marginTop":"-265px"})
        }
        $scope.$apply();
    }

    $scope.FileUp = function(){
        if($scope.File==null){
            alert("没有新的可上传文件");
            return
        }
        var fd = new FormData();
        fd.append("image", $scope.File);
        $scope.upnoice = "正在上传文件";
        $http.post("/", fd, {
            withCredentials: true,
            //headers: {'Content-Type': undefined },
            transformRequest: angular.identity
        }).success(function (data) {
            $scope.upnoice = "";
            $scope.imgurl = data
            console.log(data)
        }).error(function (data) {
            $scope.upnoice = "";
            alert(data)
        });
    }

    function onLoadFile(event) {
        var img = new Image();
        img.onload = onLoadImage;
        img.src = event.target.result;
    }

    var helper = {
        support: !!($window.FileReader && $window.CanvasRenderingContext2D),
        isFile: function(item) {
            return angular.isObject(item) && item instanceof $window.File;
        },
        isImage: function(file) {
            var type =  '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    };

    function onLoadImage() {
        if (this.width>772||this.height>537){
            if (this.width/772 >= this.height/537){
                imgWidth = 772;
                imgheight = this.height*772/this.width
            }else{
                imgheight = 537;
                imgWidth = this.width*772/this.height
            }
        }else{
            imgWidth = this.width;
            imgheight = this.height;
        }
        $("#preimg").attr({ width: imgWidth, height: imgheight });
        $("#preimg").css({"width":imgWidth+"px","height":imgheight+"px","marginTop":(537-imgheight)/2+"px","marginLeft":(772-imgWidth)/2+"px"})
        $("#preimg")[0].getContext('2d').drawImage(this, 0, 0, imgWidth, imgheight);
    }
};

HelpController = function ($scope, $route, $routeParams, $location, $http) {

}


vim.directive('ngThumb', ['$window', function ($window) {
    var helper = {
        support: !!($window.FileReader && $window.CanvasRenderingContext2D),
        isFile: function (file) {
            return angular.isObject(file) && file instanceof $window.File;
        },
        isImage: function (file) {
            var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    };

    return {
        restrict: 'A',
        template: '<canvas/>',
        link: function (scope, element, attributes) {
            if (!helper.support) return;

            var params = scope.$eval(attributes.ngThumb);

            if (!helper.isFile(params.file)) return;
            if (!helper.isImage(params.file)) return;

            var canvas = element.find('canvas');
            var reader = new FileReader();

            reader.onload = onLoadFile;
            reader.readAsDataURL(params.file);

            function onLoadFile(event) {
                var img = new Image();
                img.onload = onLoadImage;
                img.src = event.target.result;
            }

            function onLoadImage() {
                var width = this.width
                var height = this.height
                canvas.attr({ width: width, height: height });
                canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
            }
        }
    };
}]);

vim.directive('ngFileDrop', function () {
    return {
        // don't use drag-n-drop files in IE9, because not File API support
        link: function (scope, element, attributes) {
            element.bind('drop', function (event) {
                var dataTransfer = event.dataTransfer ?
                    event.dataTransfer :
                    event.originalEvent.dataTransfer; // jQuery fix;
                if (!dataTransfer) return;
                event.preventDefault();
                event.stopPropagation();
                scope.$broadcast('file:removeoverclass');
                var model = scope.$eval(attributes.ngFileDrop);
                model(dataTransfer.files)
            }).bind('dragover', function (event) {
                    var dataTransfer = event.dataTransfer ?
                        event.dataTransfer :
                        event.originalEvent.dataTransfer; // jQuery fix;
                    event.preventDefault();
                    event.stopPropagation();
                    dataTransfer.dropEffect = 'copy';
                    element.addClass('ng-file-over');
                }).bind('dragleave', function () {
                   element.removeClass('ng-file-over');
            });
        }
    };
})