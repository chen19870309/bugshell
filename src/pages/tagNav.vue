<template>
    <div class="tag-nav">
        <scroll-bar ref="scrollBar" style="height:100%">
            <router-link ref="tag" class="tag-nav-item" :class="isActive(item) ? 'cur' : ''" v-for="(item, index) in tagNavList" :to="{path:item.path,query:item.query}" :key="index" style="display:inline-block; ">
                <div class="webtag">
                {{item.title}}
                <span  v-if="item.name!=='/main'" @click.prevent.stop="closeTheTag(item, index)"><i class="el-icon-close"></i></span>
                </div>
            </router-link>
        </scroll-bar>
    </div>
</template>
<script>
import ScrollBar from './scrollBar.vue'
export default {
    components: {
        ScrollBar
    },
    data(){
        return {
            defaultPage: '/main',
        }
    },
    computed: {
        tagNavList(){
            return this.$store.state.tagNav.openedPageList;
        },
    },
    mounted(){
        // 首次加载时将默认页面加入缓存
        this.addTagNav()
    },
    watch: {
        $route(){
            this.addTagNav()
            this.scrollToCurTag()
        }
    },
    methods: {
        addTagNav(){
            this.$store.dispatch('tagNav/initPageList');
            if(this.$route.path == "/") return
            var name = this.$route.fullPath
            // 如果需要缓存则必须使用组件自身的name，而不是router的name
            var title = this.$route.query.title ? this.$route.query.title : this.$router.getMatchedComponents()[0].name
            this.$store.commit("tagNav/addTagNav", {
                name: name,
                path: this.$route.path,
                title: title,
                fullpath: this.$route.fullPath,
                query: this.$route.query,
            })
        },
        isActive(item){
            // 根据当前路由访问更新当前访问标签页面数据
            if(item.fullpath == this.$route.fullPath){
                this.$store.commit("tagNav/setCurrentTagNav",item);
                if(item.path == "/editor"){
                    console.log('current',this.$route.query.id)
                    this.$store.state.updatadoc = true
                }
            }
            return item.fullpath === this.$route.fullPath
        },
        closeTheTag(item, index){
            // 当关闭当前页面的Tag时，则自动加载前一个Tag所属的页面
            // 如果没有前一个Tag，则加载默认页面
            this.$store.commit("tagNav/removeTagNav", item)
            if(this.$route.fullPath == item.fullpath){
                // 去掉当前页面之后，还有已打开的tab页面时
                if(this.tagNavList.length != 0){
                    // 关闭的页面不为已打开页面的首个tab页面
                    if(index !=0){
                        this.$router.push({path:this.tagNavList[index-1].path,query:this.tagNavList[index-1].query})
                    } else {
                        // 关闭首个tab页面
                        this.$router.push({path:this.tagNavList[index].path,query:this.tagNavList[index].query})
                    }
                } else {
                    // 已经没有已打开的tab页面，默认打开首页
                    this.$router.push(this.defaultPage)
                }
            } 
            this.scrollToCurTag();
        },
        // 根据当前访问页面滚动到相应标签位置
        scrollToCurTag(){
            this.$nextTick(() =>{
                for (let item of this.$refs.tag) {
                    var curpath = item.to.path + '?id=' + item.to.query.id
                    if (curpath === this.$route.fullPath) {
                        this.$refs.scrollBar.scrollToCurTag(item.$el)
                        break
                    }
                }
            })
        }
    },
}
</script>
<style>
.webtag {
    color: #2C3E50;
    font-size: 16px; 
    text-align: center;
}
.tag-nav{
    overflow-x: hidden;
}
.tag-nav-item {
    background: #F4ECF7 ;
    border: 1px solid #eee;
    boder-top-right-radius: 30px;
}
.cur {
    background: #D2B4DE;
}
</style>