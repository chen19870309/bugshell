.PHONY: dist build
install:
	@npm install

dev: install
	@npm run dev

build:
	@npm run build
package:
	rm -rf  ./bugshell-app 
	electron-packager . bugshell --platform=win32 --arch=x64 --out bugshell-app --overwrite \
	--ignore=logs --ignore=src/pages/* 
	rm -rf ./bugshell-app/bugshell-win32-x64/resources/app/dist/*.map
	rm -rf ./bugshell-app/bugshell-win32-x64/resources/app/node_modules/element-ui
	rm -rf ./bugshell-app/bugshell-win32-x64/resources/app/node_modules/vue
	rm -rf ./bugshell-app/bugshell-win32-x64/resources/app/node_modules/vxe-table
	rm -rf ./bugshell-app/bugshell-win32-x64/resources/app/node_modules/codemirror

