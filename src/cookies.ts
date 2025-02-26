interface CookieObject {
    [key: string]: HTMLSelectElement;
}

export class Cookies {
    private $COOKIE_EXPIRE_DAYS = 30;
    private cookies: CookieObject;

    constructor(cookies: CookieObject) {
        this.cookies = cookies;
        this.load();
    }

    load(): void {
        const allCookies = document.cookie.split(";");
        allCookies.map((cookie) => {
            const splitCookie = cookie.split("=");
            if (splitCookie.length !== 2) {
                throw new Error("Invalid cookie format");
            }
            const [documentCookieName, documentCookieValue] = splitCookie;
            if (documentCookieName in this.cookies) {
                this.cookies[documentCookieName].value =
                    decodeURIComponent(documentCookieValue);
            }
        });
    }

    save(): void {
        let expires = "";
        if (this.$COOKIE_EXPIRE_DAYS > 0) {
            const exdate = new Date();
            exdate.setDate(exdate.getDate() + this.$COOKIE_EXPIRE_DAYS);
            expires = `;expires=${exdate.toUTCString()}`;
        }

        Object.entries(this.cookies).map(([cookieName, cookieField]) => {
            const cookieValue = encodeURIComponent(cookieField.value);
            document.cookie = `${cookieName}=${cookieValue}${expires}`;
        });
    }
}
