/**
 *
 * Created by Gentean.
 * Mail: 4083189@qq.com
 * Date: 16/1/15
 * Time: 下午5:49
 */
(function ($, window, undefined) {

    $.GoodTab = GoodTab;
    function GoodTab(selector, options) {
        var me = this;
        options = $.extend($.GoodTab.defaultOptions, options);
        var container$Elm = selector.selector ? selector : $(selector),
            header$Elm = container$Elm.find('.good-tab-header'),
            body$Elm = container$Elm.find('.good-tab-body'),
            navBar$Elm = $(document.createElement('div')),
            slide$Elm,
            content$Elm;

        var ctaWidth = container$Elm.width(),
            ctaHeight = container$Elm.height(),
            headerHeight = header$Elm.height();

        // 当前所在索引
        var itemIndex = 0;
        var itemLength = 0;


        header$Elm.css({'position': 'relative'}).prepend(navBar$Elm.addClass(options.navBarClass).css(options.navBarStyle));
        navBarScroll(0);

        // 重新包装滚动内容
        body$Elm.css({
            'width': '100%',
            'overflow': 'hidden',
            'position': 'relative',
            'height': ctaHeight - headerHeight + 'px'
        }).prepend('<div class="slide" style="-webkit-transform: translateX(0); transform: translateX(0); height: 100%;"></div>').find('aside').each(function (i) {
            itemLength++;
            setTranslate3dX(this, i * ctaWidth);
            this.style['box-sizing'] = 'border-box';
            this.style['-webkit-box-sizing'] = 'border-box';
            this.style['height'] = '100%';
            this.style['width'] = ctaWidth + 'px';
            this.style['overflow'] = 'hidden';
            this.style['position'] = 'absolute';
            this.style['top'] = '0';
            this.style['left'] = '0';
            this.innerHTML =
                '<div class="container" style="position:relative; z-index:1; height: 100%; ' + (options.showScrollBar ? '' : 'width:' + (ctaWidth + 40) + 'px;') + ' overflow-y: scroll; overflow-x: hidden;">' +
                '  <div style="position: relative;">' +
                '    <div style="overflow: hidden; height: ' + (options.pullStyle == 'spring' ? 0 : options.pullMax) + 'px;position: absolute;top:0;width: ' + ctaWidth + 'px" class="pull-fresh">' +
                '        <div style="position: absolute; top: 0; bottom:0;left: 0; right:0;display: -webkit-box; -webkit-box-align: center;-webkit-box-orient: vertical; -webkit-box-pack: center;">' +
                '            ' + options.pullHtml + '' +
                '        </div>' +
                '    </div>' +
                '    <div class="content" style="position:relative; z-index:2; width: ' + ctaWidth + 'px">' + this.innerHTML + '</div>' +
                '    <div style="overflow: hidden; height: ' + (options.pullStyle == 'spring' ? 0 : options.pushMax) + 'px; z-index:1; position: absolute; bottom:0;width: ' + ctaWidth + 'px" class="push-load">' +
                '        <div style="position: absolute; top: 0; bottom:0;left: 0; right:0;display: -webkit-box; -webkit-box-align: center;-webkit-box-orient: vertical; -webkit-box-pack: center;">' +
                '            ' + options.pushHtml + '' +
                '        </div>' +
                '    </div>' +
                '  </div>' +
                '</div>';
            if (!slide$Elm) {
                slide$Elm = $(this).prev();
            }
            $(this).appendTo(slide$Elm);
        });

        content$Elm = container$Elm.find('aside .container');

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
        container$Elm.on('tap', '.good-tab-header li', function (e) {
            var index = $(this).index();
            changeNav(index);
            changeItem(index);
            navBarScroll(index);
            itemIndex = -index;
        });

        container$Elm.on('touchstart', '.good-tab-body', function (e) {
            container$Elm.off('touchmove');
            // 如果到下拉或上拉的最大值后取消事件，等待加载
            if (!pullAble || !pushAble) {
                return;
            }
            var touchOne = e.originalEvent.touches[0];
            startX = touchOne.pageX;
            startY = touchOne.pageY;
            firstStatus = false;
            content = getCurrentContent();
            var scrollTop = content.scrollTop;
            isTop = scrollTop == 0;
            isBottom = content.children[0].offsetHeight <= content.offsetHeight || content.children[0].offsetHeight - content.offsetHeight == scrollTop;

            if (isTop || isBottom) {
                container$Elm.on('touchmove', '.good-tab-body', moveHandle);
            }
        });

        function moveHandle(e) {
            var touchOne = e.originalEvent.touches[0];
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
                                setTranslate3dX(slide$Elm, targetLeft);
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
                        else if (subY < 0 && (isBottom)) {
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
                        container$Elm.off('touchmove');
                    }
                }
            }
        }

        container$Elm.on('touchend', '.good-tab-body', function (e) {
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
                tempSubY = subY;
                if (!beginPull) {
                    beginPull = true;
                }
            }

            if (subY >= tempSubY) {
                var height = (subY - tempSubY) / (1 + options.resistance);
                if (height >= options.pullMax) {
                    pullAble = false;
                    container$Elm.trigger('pullRefreshBegin', [Math.abs(itemIndex), this]);
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
                    container$Elm.trigger('pullRefreshing', [pullBoxElm, height]);
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
                container$Elm.trigger('pushToBottom', [Math.abs(itemIndex), this]);
                tempSubY = subY;
                if (!beginPush) {
                    beginPush = true;
                }
            }

            if (subY <= tempSubY) {
                var height = (tempSubY - subY) / (1 + options.resistance);
                if (height >= options.pushMax) {
                    pushAble = false;
                    container$Elm.trigger('pushLoadBegin', [Math.abs(itemIndex), this]);
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
                    container$Elm.trigger('pushLoading', [pushBoxElm, height]);
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
                    $(content.children[0].children[1]).animate({'-webkit-transform': 'translateY(0)'}, options.retractSpeed, 'ease');
                    break;
                case 'spring':
                    $(content.children[0].firstElementChild).animate({height: 0}, options.retractSpeed, 'ease');
                    $(content.children[0].children[1]).animate({'-webkit-transform': 'translateY(0)'}, options.retractSpeed, 'ease');
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
                    $(content.children[0].children[1]).animate({'-webkit-transform': 'translateY(0)'}, options.retractSpeed, 'ease');
                    break;
                case 'spring':
                    $(content.children[0].lastElementChild).animate({height: 0}, options.retractSpeed, 'ease');
                    $(content.children[0].children[1]).animate({'-webkit-transform': 'translateY(0)'}, options.retractSpeed, 'ease');
                    break;
            }
        };

        function getCurrentContent() {
            return content$Elm.get(Math.abs(itemIndex));
        }

        /**
         * 切换内容区
         * @param toIndex
         */
        function changeItem(toIndex) {
            slide$Elm.css({
                '-webkit-transition': 'all ' + (options.changeSpeed / 1000) + 's ease',
                'transition': 'all ' + (options.changeSpeed / 1000) + 's ease',
                '-webkit-transform': 'translateX(' + (-Math.abs(toIndex) * ctaWidth) + 'px)',
                'transform': 'translateX(' + (-Math.abs(toIndex) * ctaWidth) + 'px)'
            });

            setTimeout(function () {
                slide$Elm.css({
                    '-webkit-transition': 'none',
                    'transition': 'none'
                });
            }, options.changeSpeed);
        }

        /**
         * 切换标签
         */
        function changeNav(toIndex) {
            header$Elm.find('li').eq(Math.abs(toIndex)).addClass('on').siblings().removeClass('on');
        }

        /**
         * 水平滑动内容区
         * @param elm
         * @param value
         */
        function setTranslate3dX(elm, value) {
            $(elm).css({
                '-webkit-transform': 'translateX(' + value + 'px)',
                'transform': 'translateX(' + value + 'px)'
            });
        }

        /**
         * 滑块滚动
         */
        function navBarScroll(newIndex, subX) {
            newIndex = Math.abs(newIndex);
            var oldIndex$Elm = header$Elm.find('li.on');
            var newNavInfo = getNavInfo(newIndex);

            if (subX) {
                var oldNavInfo = getNavInfo(oldIndex$Elm.index());
                var scale = subX / ctaWidth;
                var left = oldNavInfo.offsetLeft - scale * (Math.abs(newNavInfo.offsetLeft - oldNavInfo.offsetLeft));

                if (oldNavInfo.width > newNavInfo.width) {
                    scale = Math.abs(scale);
                } else {
                    scale = -Math.abs(scale);
                }
                var width = oldNavInfo.width - scale * (Math.abs(newNavInfo.width - oldNavInfo.width));
                navBar$Elm.css({left: left, width: width});
            } else {
                navBar$Elm.animate({left: newNavInfo.offsetLeft, width: newNavInfo.width});
            }
        }



        /**
         * 获取标签信息
         */
        function getNavInfo(index) {
            var nav$Elm = header$Elm.find('li').eq(index);
            return {
                width: nav$Elm.width(),
                offsetLeft: nav$Elm.offset().left
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
    $.GoodTab.defaultOptions = {
        // 最大下拉像素(px)
        pullMax: 100,
        // 最大上拉像素(px)
        pushMax: 100,
        // 剩余多少像素加开始自动加载
        autoLoadPosition: 50,
        // 拉动阻力系数(0-3)
        resistance: 3,
        // 拉动方式：drawer/抽屉式,spring/弹簧式
        pullStyle: 'spring',
        // 下拉html
        pullHtml: '<div style="height: 100%; background: #000; color: #ffffff;">这是下拉刷新临时html</div>',
        // 上拉html
        pushHtml: '<div style="height: 100%; background: #000; color: #ffffff;">这是上拉刷新临时html</div>',
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
        ablePushLoad: false,
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
        }
    };

    $.fn.goodTab = function (options) {
        this.each(function (key, item) {
            new $.GoodTab(item, options);
        });
        return this;
    };
})(Zepto, window);
