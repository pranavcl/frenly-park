const socket = io(window.location.origin, { autoConnect: false });

const routes = [
	{ path: "/", component: Home },
	{ path: "/join/:room", component: Home },
	{ path: "/room/:room", component: Room },
];

const router = VueRouter.createRouter({
	history: VueRouter.createWebHashHistory(),
	routes,
});

const app = Vue.createApp({});
app.use(router);
app.mount("#app");
