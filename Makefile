PHANTOMAS_VERSION=0.4.1
PHANTOMAS_PATH=https://github.com/macbre/phantomas/archive/$(PHANTOMAS_VERSION).zip

bench: setup
	node ./index.js

setup: lib/phantomas
	npm install

clean:
	rm -rf node_modules lib/phantomas

lib/phantomas:
	(mkdir -p ./lib/ || true )                      && \
	cd ./lib                                        && \
		wget $(PHANTOMAS_PATH)                         \
			-O $(PHANTOMAS_VERSION).zip             && \
		unzip $(PHANTOMAS_VERSION).zip              && \
		mv phantomas-$(PHANTOMAS_VERSION) phantomas && \
		rm $(PHANTOMAS_VERSION).zip

