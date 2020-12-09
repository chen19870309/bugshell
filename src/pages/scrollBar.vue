<template>
    <div class="scroll-wrap" ref="scrollWrap" @wheel.prevent="scroll">
        <div class="scroll-cont" ref="scrollCont" :style="{left: left + 'px'}">
            <slot></slot>
        </div>
    </div>
</template>

<script>

import { parse } from 'path'
export default {
    data(){
        return {
            // 滚动距离
            left: 0,
            // 滚动速度
            wheelSpeed: 30,
        }
    },
    created(){
        // 从缓存中获取当前left的值，避免页面刷新，不保持问题
        this.left = parseInt(sessionStorage.getItem('leftScroll'))
        console.log(this.left,sessionStorage.getItem('leftScroll'))
        if(isNaN(this.left)) {
            this.left = 0
        }
    },
    methods: {
        // 滚轮滚动定义标签位置
        scroll(e){
            var scrollWrapWidth = this.$refs.scrollWrap.offsetWidth *0.5
            var scrollContWidth = this.$refs.scrollCont.offsetWidth
            console.log(scrollWrapWidth,scrollContWidth,this.left)
            if(scrollContWidth > scrollWrapWidth){
                // 统一不同浏览器下wheel事件的滚动值
                // chrome/FF/Edge/IE11/IE10/IE9
                // e.deltaY > 0 即鼠标滚轮向下滚动，则该条向右滚动，left值变负
                var scrollSpace = e.deltaY > 0 ? -1 * this.wheelSpeed : this.wheelSpeed
                this.left += scrollSpace
                if(this.left >0){
                    this.left = 0
                }
                if(Math.abs(this.left + scrollContWidth) <=  scrollWrapWidth){
                    this.left  =  scrollWrapWidth - scrollContWidth
                }
                sessionStorage.setItem('leftScroll',this.left);
            } else {
                return
            }
        },
        // 定位滚动到当前访问页面标签
        scrollToCurTag(tar){
            const scrollWrapWidth = this.$refs.scrollWrap.offsetWidth - (this.$refs.scrollWrap.offsetWidth*0.15)
            const tarWidth = tar.offsetWidth
            const tarLeft = tar.offsetLeft
            if(tarLeft < -1 * this.left){
                this.left = -tarLeft
                sessionStorage.setItem('leftScroll',this.left);
            } else if(tarLeft + tarWidth > scrollWrapWidth){
                this.left = -(tarLeft + tarWidth - scrollWrapWidth)
                sessionStorage.setItem('leftScroll',this.left);
            }
        }
    }
}
</script>

<style>
.scroll-wrap{
    float: left;
    overflow-y: hidden;
    overflow-x: auto;
    white-space: nowrap;
}
.scroll-cont{
    position: relative;
    display: inline-block;
}
</style>