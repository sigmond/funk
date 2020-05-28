all: funk_proxy/funk_proxy funk

funk_proxy/funk_proxy:
	(cd funk_proxy; make clean all)

clean:
	(cd funk_proxy; make clean)
	rm -f funk *.o
