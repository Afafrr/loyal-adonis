Proponowana kolejność:
Widok szczegółów loyalty card po kliknięciu.
Pokazuje program, postęp, historię wizyt i dostępne nagrody. To wykorzysta istniejący endpoint me/loyalty_rewards.

Minimalny panel pracownika/właściciela.
Tylko logowanie, wybór lokalu, zeskanowanie kodu nagrody i potwierdzenie jej wykorzystania. Bez rozbudowanych statystyk i konfiguratora.

Bezpieczna realizacja nagrody.
Klient pokazuje krótko ważny, jednorazowy QR. Pracownik skanuje go, a API sprawdza:
czy nagroda należy do klienta,
czy nie została już wykorzystana,
czy pracownik ma dostęp do właściwej firmy/lokalu,
czy token nie wygasł,
następnie ustawia redeemed_at, redeemed_at_venue_id i redeemed_by_user_id.

Dopiero potem pełniejszy panel właściciela:
zarządzanie lokalami,
konfiguracja programu,
liczba wymaganych stempli,
nazwa nagrody,
aktywacja/dezaktywacja programu,
statystyki.




- program moze byc ograniczony czasowo