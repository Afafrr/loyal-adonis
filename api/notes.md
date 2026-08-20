- for now last_acceped counter in database is not used, to be decided, how should it be used:
  - eg range every counter last_acceped - eg. 5 is valid
- add protected routes for frontend
- maybe to ensure the fastest loading of collected stamp, there could be dedicated page with not much infor eg stamps, venue, etc. So it could load fast even with limited network, then by clicking a button you could go to the dashboard 

# FOR LATER

## AUTH

- `:timeoutable` - Automatycznie kończy sesję po określonym czasie _braku aktywności_.
- `:lockable` - optional - Blokuje konto po kilku nieudanych próbach logowania. Chroni przed automatycznym zgadywaniem hasła.

## NFC

https://app.pl/scan?picc=TAG123&enc=42&cmac=ABC789

https://example.com/?_____TRIAL_VERSION______NOT_FOR_PRODUCTION_____&picc_data=8314399577DCFFE9798B4C4714FB89EE&enc=D0E3028A46AFCBA11B9DB95E36C55762&cmac=6F586B688126B57C

https://example.com/?_____TRIAL_VERSION______NOT_FOR_PRODUCTION_____&picc_data=A0381B865380C7C8C6EF42190DDE5E56&enc=9692DB303A155945B65F3CE7108BC690&cmac=A66F57C738769417

gh: https://github.com/nfc-developer/sdm-backend#manual-installation

RESPONSE:

`enc_mode:` "AES" - Tag użył AES w mechanizmie SDM do szyfrowania dynamicznych danych.  
`uid:` "041C6432A91190" - Unikalny, 7-bajtowy identyfikator fizycznego taga NFC (UID). To dobry kandydat na identyfikator karty klienta.  
`read_ctr:` 13 - Licznik odczytów. Tag zwiększa go przy każdym skanie, dzięki czemu URL/dane są dynamiczne i trudne do skopiowania („replay”).  
`file_data:` "58587465737431000000000000000000" - Odszyfrowana zawartość pliku SDM z taga, zapisana jako hex.  
`tt_status:` "" - Puste, bo wywołujesz zwykły endpoint /api/tag, a nie wariant dla NTAG TagTamper. Nie jest to błąd.

## Docker

docker compose up backend
docker compose run --rm backend npm test