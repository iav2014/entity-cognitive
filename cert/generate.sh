The command below it is going to generate a file containing an RSA key.

$ openssl genrsa 1024 > file.pem
Here you will be asked to input data but you can leave blank pressing enter until the crs.pem is generated.

$ openssl req -new -key file.pem -out csr.pem
Then a file.crt file will be created containing an SSL certificate.

$ openssl x509 -req -days 365 -in csr.pem -signkey file.pem -out file.crt

