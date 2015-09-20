PHANTOMAS_VERSION=v0.8.1
PHANTOMAS_PATH=https://github.com/macbre/phantomas/archive/$(PHANTOMAS_VERSION).zip

test: .PHONY
	./node_modules/.bin/nodeunit ./test/*_test.js

run:
	./index.js server

start:
	NODE_ENV=production nohup ./index.js server --config ./config.json &

kill:
	pkill -9 -f "bench/server/app.js"

bench: setup
	node ./index.js

setup:
	npm install

clean:
	rm -rf node_modules lib/phantomas

lib/phantomas:
	(mkdir -p ./lib/ || true )                      && \
	cd ./lib                                        && \
		wget $(PHANTOMAS_PATH)                         \
			-O $(PHANTOMAS_VERSION).zip             && \
		unzip $(PHANTOMAS_VERSION).zip              && \
		mv phantomas-* phantomas && \
		rm $(PHANTOMAS_VERSION).zip

.PHONY:
