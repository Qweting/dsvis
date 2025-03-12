import { Debug } from "./debug";

interface CookieObject {
    [key: string]: HTMLSelectElement;
}

export class Cookies {
    private $COOKIE_EXPIRE_DAYS = 30;
    private cookies: CookieObject;
    private debug: Debug;

    constructor(initialCookies: CookieObject, debug: Debug) {
        this.cookies = initialCookies;
        this.debug = debug;
        this.load(); // Set element values to saved values
        this.addEventListeners();
        this.save(); // Save on initialization to add more days before expiration
    }

    addEventListeners(): void {
        this.debug.log(
            "Adding event listeners to cookie elements",
            this.cookies
        );

        Object.values(this.cookies).map((cookieField) => {
            cookieField.addEventListener("change", () => this.save());
        });
    }

    load(): void {
        this.debug.log("Loading cookies", document.cookie);

        const allCookies = document.cookie.split("; ");
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
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + this.$COOKIE_EXPIRE_DAYS);
            expires = `;expires=${expiryDate.toUTCString()}`;
        }

        Object.entries(this.cookies).map(([cookieName, cookieField]) => {
            const cookieValue = encodeURIComponent(cookieField.value);
            document.cookie = `${cookieName}=${cookieValue}${expires}`;
        });

        this.debug.log("Setting cookies", document.cookie);
    }
}
