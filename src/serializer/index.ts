export const errorSerializer = () => {
    Object.defineProperty(Error.prototype, 'toJSON', {
        // tslint:disable-next-line:object-literal-shorthand
        value: function () {
            const alt = {};

            Object.getOwnPropertyNames(this).forEach(function (key) {
                alt[key] = this[key];
            }, this);

            return alt;
        },
        configurable: true,
        writable: true
    });
}