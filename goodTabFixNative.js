/**
 * 左右滑动上拉下拉tab控件
 * Created by Gentean.
 * Mail: 4083189@qq.com
 * Date: 16/1/15
 * Time: 下午5:49
 */
(function(root, factory){
    // AMD
    if (typeof define === 'function' && define.amd) {
        define(['exports'], function(exports) {
            exports.GoodTab = factory(root);
        });
    }
    // Node.js or CommonJS
    else if (typeof exports !== 'undefined') {
        exports.GoodTab = factory(root);
    }
    // Global
    else {
        root.GoodTab = factory(root);
    }
}(this, function (root, undefined) {
    var class2type = {}, key;

    function type(obj) {
        return obj == null ? String(obj) :
        class2type[toString.call(obj)] || "object"
    }

    function isFunction(value) {
        return type(value) == "function"
    }

    function isWindow(obj) {
        return obj != null && obj == obj.window
    }

    function isDocument(obj) {
        return obj != null && obj.nodeType == obj.DOCUMENT_NODE
    }

    function isObject(obj) {
        return type(obj) == "object"
    }

    function isPlainObject(obj) {
        return isObject(obj) && !isWindow(obj) && obj.__proto__ == Object.prototype
    }

    function isArray(value) {
        return value instanceof Array
    }

    function likeArray(obj) {
        return typeof obj.length == 'number'
    }

    function extend(target, source, deep) {
        for (key in source)
            if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
                if (isPlainObject(source[key]) && !isPlainObject(target[key]))
                    target[key] = {}
                if (isArray(source[key]) && !isArray(target[key]))
                    target[key] = []
                extend(target[key], source[key], deep)
            }
            else if (source[key] !== undefined) target[key] = source[key]
        return target;
    }

    function GoodTab(selector, userOption) {
        var me = this;
        var options = extend(this.defaultOptions, userOption, 1);

        var containerElm = document.getElementById(selector),
            headerElm = containerElm.getElementsByClassName('good-tab-header')[0],
            bodyElm = containerElm.getElementsByClassName('good-tab-body')[0],
            navBarElm = document.createElement('div'),
            slideElm = document.createElement('div'),
            navLiElms = headerElm.getElementsByTagName('li');

        var ctaWidth = containerElm.offsetWidth,
            ctaHeight = containerElm.offsetHeight,
            headerHeight = headerElm.offsetHeight;

        // 当前所在索引
        var itemIndex = 0;
        var itemLength = 0;


        headerElm.style.position = 'relative';
        navBarElm.className = options.navBarClass;
        extend(navBarElm.style, options.navBarStyle);
        headerElm.insertBefore(navBarElm, headerElm.firstChild);

        navBarScroll(0);

        // 重新包装滚动内容
        extend(bodyElm.style, {
            'width': '100%',
            'overflow': 'hidden',
            'position': 'relative',
            'height': ctaHeight - headerHeight + 'px'
        });

        slideElm.className = 'slide';
        slideElm.style.webkitTransform = 'translateX(0)';
        slideElm.style.transform = 'translateX(0)';
        slideElm.style.height = '100%';

        bodyElm.insertBefore(slideElm, bodyElm.firstChild);

        var asideElms = bodyElm.getElementsByTagName('aside');
        for (var i = 0, len = asideElms.length; i < len; i++) {
            var asideItem = asideElms[i];
            itemLength++;
            setTranslate3dX(asideItem, i * ctaWidth);
            asideItem.style.boxSizing = 'border-box';
            asideItem.style.webkitBoxSizing = 'border-box';
            asideItem.style.height = '100%';
            asideItem.style.width = ctaWidth + 'px';
            asideItem.style.overflow = 'hidden';
            asideItem.style.position = 'absolute';
            asideItem.style.top = '0';
            asideItem.style.left = '0';
            asideItem.innerHTML =
                '<div class="container" style="position:relative; z-index:1; height: 100%; ' + (options.showScrollBar ? '' : 'width:' + (ctaWidth + 40) + 'px;') + ' overflow-y: scroll; overflow-x: hidden;">' +
                '  <div style="position: relative;">' +
                '    <div style="overflow: hidden; height: ' + (options.pullStyle == 'spring' ? 0 : options.pullMax) + 'px;position: absolute;top:0;width: ' + ctaWidth + 'px" class="pull-fresh">' +
                '        <div style="position: absolute; top: 0; bottom:0;left: 0; right:0;display: -webkit-box; -webkit-box-align: center;-webkit-box-orient: vertical; -webkit-box-pack: center;">' +
                '            ' + options.pullHtml + '' +
                '        </div>' +
                '    </div>' +
                '    <div class="content" style="position:relative; z-index:2; width: ' + ctaWidth + 'px">' + asideItem.innerHTML + '</div>' +
                '    <div style="overflow: hidden; height: ' + (options.pullStyle == 'spring' ? 0 : options.pushMax) + 'px; z-index:1; position: absolute; bottom:0;width: ' + ctaWidth + 'px" class="push-load">' +
                '        <div style="position: absolute; top: 0; bottom:0;left: 0; right:0;display: -webkit-box; -webkit-box-align: center;-webkit-box-orient: vertical; -webkit-box-pack: center;">' +
                '            ' + options.pushHtml + '' +
                '        </div>' +
                '    </div>' +
                '  </div>' +

                '</div>';
            slideElm.appendChild(asideItem);
        }


        var startX, startY, subX, subY, firstStatus = false;
        // 下拉是否可用
        var pullAble = true;
        var beginPull = false;
        // 到底部时subY值
        var pushAble = true;
        var beginPush = false;
        var tempSubY;
        var isTop, isBottom;
        var content;

        /**
         * 点击导航
         */
        headerElm.addEventListener('click', function (e) {
            var navLiElms = headerElm.getElementsByTagName('li');
            var index = -1;
            for (var i = 0, len = navLiElms.length; i < len; i++) {
                if (navLiElms[i] === e.target) {
                    index = i;
                    break;
                }
            }
            if (index >= 0) {
                changeNav(index);
                changeItem(index);
                navBarScroll(index);
                itemIndex = -index;
            }
        }, false);

        bodyElm.addEventListener('touchstart', function (e) {
            bodyElm.removeEventListener('touchmove');
            // 如果到下拉或上拉的最大值后取消事件，等待加载
            if (!pullAble || !pushAble) {
                return;
            }
            var touchOne = e.targetTouches[0];
            startX = touchOne.pageX;
            startY = touchOne.pageY;
            firstStatus = false;
            content = getCurrentContent();
            var scrollTop = content.scrollTop;
            isTop = scrollTop == 0;
            isBottom = content.children[0].offsetHeight <= content.offsetHeight || content.children[0].offsetHeight - content.offsetHeight == scrollTop;

            if (isTop || isBottom) {
                bodyElm.addEventListener('touchmove', moveHandle, false);
            }
        }, false);

        function moveHandle(e) {
            var touchOne = e.targetTouches[0];
            subX = touchOne.pageX - startX;
            subY = touchOne.pageY - startY;
            if (firstStatus) {
                switch (firstStatus) {
                    case 'horizontal':
                        if (options.ableLtRmove) {
                            var swipe = getSwipe();
                            var nextItemIndex;
                            if (swipe.type == 'LeftToRight') {
                                nextItemIndex = Math.abs(itemIndex) - 1;
                            }
                            else if (swipe.type == 'RightToLeft') {
                                nextItemIndex = Math.abs(itemIndex) + 1;
                            }

                            if (nextItemIndex >= 0 && nextItemIndex < itemLength) {
                                var targetLeft = itemIndex * ctaWidth + subX;
                                navBarScroll(nextItemIndex, subX);
                                setTranslate3dX(slideElm, targetLeft);
                            }
                        }

                        break;
                    case 'vertical':
                        // 到顶部操作
                        if (subY > 0 && isTop) {
                            if (options.ablePullRefresh) {
                                me.pullHandle(e, content.children[0].firstElementChild, subY);
                            }
                        }
                        // 到底部操作
                        else if (subY < 0 && isBottom) {
                            if (options.ablePushLoad || options.ableAutoLoad) {
                                me.pushHandle(e, content.children[0].lastElementChild, subY);
                            }
                        }
                        break;
                }
            } else {
                // 首次确定手势趋势
                if (Math.abs(subX) - Math.abs(subY) > options.difference) {
                    firstStatus = 'horizontal';
                    e.preventDefault();
                }
                if (Math.abs(subY) - Math.abs(subX) > options.difference) {
                    firstStatus = 'vertical';
                    // 非顶部底部操作移除touchmove事件，以使scroll生效);
                    if (subY > 0 && isTop) {
                        e.preventDefault();
                    }
                    else if (subY < 0 && isBottom) {
                        e.preventDefault();
                    }
                    else {
                        bodyElm.removeEventListener('touchmove');
                    }
                }
            }
        }

        bodyElm.addEventListener('touchend', function (e) {
            var swipe = getSwipe();
            switch (swipe.type) {
                case 'LeftToRight':
                    changeItem(itemIndex == 0 || swipe.value < options.minLtR ? 0 : ++itemIndex);
                    navBarScroll(itemIndex);
                    changeNav(itemIndex);
                    break;
                case 'RightToLeft':
                    changeItem(Math.abs(itemIndex) == itemLength - 1 || swipe.value < options.minLtR ? itemLength - 1 : --itemIndex);
                    navBarScroll(itemIndex);
                    changeNav(itemIndex);
                    break;
                case 'UpToDown':
                    // 如果下拉中途松手
                    if (options.ablePullRefresh && pullAble && beginPull) {
                        me.retractingPull();
                    }
                    break;
                case 'DownToUp':
                    // 如果上拉中途松手
                    if ((options.ableAutoLoad || options.ablePushLoad) && pushAble && beginPush) {
                        me.retractingPush();
                    }
                    break;
                default :
                    break
            }
        });

        /**
         * 顶部下拉处理
         * @param e
         * @param pullBoxElm
         * @param subY 手势Y轴差
         */
        this.pullHandle = function (e, pullBoxElm, subY) {
            if (!pullAble) return;
            if (!tempSubY) {
                // 触发到顶部事件
                options.pullToTop.call(this, Math.abs(itemIndex));
                tempSubY = subY;
                if (!beginPull) {
                    beginPull = true;
                }
            }

            if (subY >= tempSubY) {
                var height = (subY - tempSubY) / (1 + options.resistance);
                if (height >= options.pullMax) {
                    pullAble = false;
                    options.pullRefreshBegin.call(this, Math.abs(itemIndex), pullBoxElm, height);
                } else {
                    // 下拉刷新显示
                    switch (options.pullStyle) {
                        case 'drawer':
                            content.children[0].children[1].style.webkitTransform = 'translateY(' + height + 'px)';
                            break;
                        case 'spring':
                            pullBoxElm.style.height = height + 'px';
                            content.children[0].children[1].style.webkitTransform = 'translateY(' + height + 'px)';
                            break;
                    }
                    options.pullRefreshing.call(this, Math.abs(itemIndex), pullBoxElm, height);
                }
            }
        };

        /**
         * 底部上拉处理
         * @param e
         * @param pushBoxElm 上拉html容器
         * @param subY 手势Y轴差
         */
        this.pushHandle = function (e, pushBoxElm, subY) {
            if (!pushAble) return;
            if (!tempSubY) {
                // 触发到底部事件
                options.pushToBottom.call(this, Math.abs(itemIndex));
                tempSubY = subY;
                if (!beginPush) {
                    beginPush = true;
                }
            }

            if (subY <= tempSubY) {
                var height = (tempSubY - subY) / (1 + options.resistance);
                if (height >= options.pushMax) {
                    pushAble = false;
                    options.pushLoadBegin.call(this, Math.abs(itemIndex), pushBoxElm, height);
                } else {
                    // 上拉加载
                    switch (options.pullStyle) {
                        case 'drawer':
                            content.children[0].children[1].style.webkitTransform = 'translateY(-' + height + 'px)';
                            break;
                        case 'spring':
                            pushBoxElm.style.height = height + 'px';
                            content.children[0].children[1].style.webkitTransform = 'translateY(-' + height + 'px)';
                            break;
                    }
                    options.pushLoading.call(this, Math.abs(itemIndex), pushBoxElm, height);
                }
            }
        };

        /**
         * 收起下拉刷新
         */
        this.retractingPull = function () {
            pullAble = true;
            beginPull = false;
            tempSubY = null;
            switch (options.pullStyle) {
                case 'drawer':
                    extend(content.children[0].children[1], {
                        '-webkit-transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        'transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        '-webkit-transform': 'translateY(0)',
                        'transform': 'translateY(0)'
                    }, 1);

                    setTimeout(function () {
                        extend(content.children[0].children[1], {
                            '-webkit-transition': 'none',
                            'transition': 'none'
                        }, 1);
                    }, options.retractSpeed);
                    break;
                case 'spring':
                    extend(content.children[0].firstElementChild.style, {
                        '-webkit-transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        'transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        'height': 0
                    }, 1);

                    extend(content.children[0].children[1].style, {
                        '-webkit-transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        'transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        '-webkit-transform': 'translateY(0)',
                        'transform': 'translateY(0)'
                    }, 1);

                    setTimeout(function () {
                        extend(content.children[0].firstElementChild.style, {
                            '-webkit-transition': 'none',
                            'transition': 'none'
                        }, 1);
                        extend(content.children[0].children[1].style, {
                            '-webkit-transition': 'none',
                            'transition': 'none'
                        }, 1);
                    }, options.retractSpeed);
                    break;
            }
        };

        /**
         * 推出上拉加载
         */
        this.retractingPush = function () {
            pushAble = true;
            beginPush = false;
            tempSubY = null;
            switch (options.pullStyle) {
                case 'drawer':
                    extend(content.children[0].children[1], {
                        '-webkit-transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        'transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        '-webkit-transform': 'translateY(0)',
                        'transform': 'translateY(0)'
                    }, 1);

                    setTimeout(function () {
                        extend(content.children[0].children[1], {
                            '-webkit-transition': 'none',
                            'transition': 'none'
                        }, 1);
                    }, options.retractSpeed);

                    break;
                case 'spring':
                    extend(content.children[0].lastElementChild.style, {
                        '-webkit-transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        'transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        'height': 0
                    }, 1);

                    extend(content.children[0].children[1].style, {
                        '-webkit-transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        'transition': 'all ' + (options.retractSpeed / 1000) + 's ease',
                        '-webkit-transform': 'translateY(0)',
                        'transform': 'translateY(0)'
                    }, 1);

                    setTimeout(function () {
                        extend(content.children[0].lastElementChild.style, {
                            '-webkit-transition': 'none',
                            'transition': 'none'
                        }, 1);
                        extend(content.children[0].children[1].style, {
                            '-webkit-transition': 'none',
                            'transition': 'none'
                        }, 1);
                    }, options.retractSpeed);

                    break;
            }
        };


        function getCurrentContent() {
            return containerElm.getElementsByClassName('container')[Math.abs(itemIndex)];
        }

        /**
         * 切换内容区
         * @param toIndex
         */
        function changeItem(toIndex) {
            extend(slideElm.style, {
                '-webkit-transition': 'all ' + (options.changeSpeed / 1000) + 's ease',
                'transition': 'all ' + (options.changeSpeed / 1000) + 's ease',
                '-webkit-transform': 'translateX(' + (-Math.abs(toIndex) * ctaWidth) + 'px)',
                'transform': 'translateX(' + (-Math.abs(toIndex) * ctaWidth) + 'px)'
            }, 1);

            setTimeout(function () {
                extend(slideElm.style, {
                    '-webkit-transition': 'none',
                    'transition': 'none'
                }, 1);
            }, options.changeSpeed);
        }

        /**
         * 切换标签
         */
        function changeNav(toIndex) {
            for (var i = 0, len = navLiElms.length; i < len; i++) {
                if (i == Math.abs(toIndex)) {
                    navLiElms[i].classList.add('on');
                } else {
                    navLiElms[i].classList.remove('on');
                }
            }
        }

        /**
         * 水平滑动内容区
         * @param elm
         * @param value
         */
        function setTranslate3dX(elm, value) {
            extend(elm.style, {
                '-webkit-transform': 'translateX(' + value + 'px)',
                'transform': 'translateX(' + value + 'px)'
            });
        }

        /**
         * 滑块滚动
         */
        function navBarScroll(newIndex, subX) {
            newIndex = Math.abs(newIndex);
            var oldIndex = -1;
            for (var i = 0, len = navLiElms.length; i < len; i++) {
                if (navLiElms[i].classList.contains('on')) {
                    oldIndex = i;
                    break;
                }
            }
            var newNavInfo = getNavInfo(newIndex);


            if (subX) {
                var oldNavInfo = getNavInfo(oldIndex == -1 ? 0 : oldIndex);
                var scale = subX / ctaWidth;
                var left = oldNavInfo.offsetLeft - scale * (Math.abs(newNavInfo.offsetLeft - oldNavInfo.offsetLeft));

                if (oldNavInfo.width > newNavInfo.width) {
                    scale = Math.abs(scale);
                } else {
                    scale = -Math.abs(scale);
                }
                var width = oldNavInfo.width - scale * (Math.abs(newNavInfo.width - oldNavInfo.width));
                navBarElm.style.left = left + 'px';
                navBarElm.style.width = width + 'px';
            } else {
                extend(navBarElm.style, {
                    '-webkit-transition': 'all ' + (options.changeSpeed / 1000) + 's ease',
                    'transition': 'all ' + (options.changeSpeed / 1000) + 's ease',
                    'left': newNavInfo.offsetLeft + 'px',
                    'width': newNavInfo.width + 'px'
                }, 1);

                setTimeout(function () {
                    extend(navBarElm.style, {
                        '-webkit-transition': 'none',
                        'transition': 'none'
                    }, 1);
                }, options.changeSpeed);
            }
        }


        /**
         * 获取标签信息
         */
        function getNavInfo(index) {
            var navElm = navLiElms[index];
            return {
                width: navElm.offsetWidth,
                offsetLeft: navElm.offsetLeft
            };
        }

        /**
         * 获取手势与幅度值
         * @returns {{}}
         */
        function getSwipe() {
            var data = {};
            switch (firstStatus) {
                case 'horizontal':
                    data.type = subX > 0 ? 'LeftToRight' : 'RightToLeft';
                    data.value = Math.abs(subX);
                    break;
                case  'vertical':
                    data.type = subY > 0 ? 'UpToDown' : 'DownToUp';
                    data.value = Math.abs(subY);
                    break;
            }
            return data;
        }
    }

    // 默认设置
    GoodTab.prototype.defaultOptions = {
        // 最大下拉像素(px)
        pullMax: 100,
        // 最大上拉像素(px)
        pushMax: 100,
        // 剩余多少像素加开始自动加载
        autoLoadPosition: 50,
        // 拉动阻力系数(0-3)
        resistance: 0,
        // 拉动方式：drawer/抽屉式,spring/弹簧式
        pullStyle: 'spring',
        // 下拉html
        pullHtml: '<div>下拉刷新</div>',
        // 上拉html
        pushHtml: '<div>上拉加载</div>',
        // 手势容差(px)
        difference: 5,
        // 左右切换生效手势(px)
        minLtR: 6,
        // 收起刷新框所用时间ms
        retractSpeed: 500,
        // 切换内容区所用时间ms
        changeSpeed: 200,
        // 显示系统滚动条
        showScrollBar: false,
        // 开启下拉刷新
        ablePullRefresh: true,
        // 开启左右滑动过渡
        ableLtRmove: true,
        // 开启上拉加载
        ablePushLoad: true,
        // 开启到指定底部位置自动加载
        ableAutoLoad: false,
        // 滑动条样默认式名
        navBarClass: 'nav-bar',
        // 滑动条默认样式
        navBarStyle: {
            'content': '',
            'display': 'block',
            'position': 'absolute',
            'height': '3px',
            'background': '#FFF',
            'z-index': '3',
            'bottom': '0',
            '-webkit-transition': 'all 0.3s',
            'transition': 'all 0.3s'
        },
        // 下拉到最大下拉像素触发
        pullRefreshBegin: function (itemIndex, BoxElm, height) {
            //this.retractingPull();  通过收起
        },
        // 下拉时持续触发
        pullRefreshing: function (itemIndex, BoxElm, height) {
        },
        // 上拉到最大上拉像素触发
        pushLoadBegin: function (itemIndex, BoxElm, height) {
            //this.retractingPush();  通过收起
        },
        // 上拉时持续触发
        pushLoading: function (itemIndex, BoxElm, height) {
        },
        // 上滑到底部时触发
        pushToBottom: function (itemIndex) {
        },
        // 下滑到顶部时触发
        pullToTop: function (itemIndex) {
        }
    };

    return GoodTab;
}));
