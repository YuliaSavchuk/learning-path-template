﻿define([], function () {
    return [
        {
            route: '',
            moduleId: 'learningPath/learningPath',
            title: 'Learning path',
            progressControlVisible: true
        },
        {
            route: 'login',
            moduleId: 'xApi/login/login',
            title: 'xApi Login',
            hideExitButton: true,
            onlyHorizontalHeader: true
        },
        {
            route: 'xapierror',
            moduleId: 'xApi/error/xapierror',
            title: 'xApi Error',
            hideExitButton: true,
            onlyHorizontalHeader: true
        }
    ];
});