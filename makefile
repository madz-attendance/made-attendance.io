all: server

server: 
	python3 -m http.server 8000 &
	open -a Safari "http://localhost:8000"

clean:
	./kill.sh
	clear