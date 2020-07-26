var my_arweave = {
    init: async function () {
        this.arweave = Arweave.init();
        this.arweave.network.getInfo().then(console.log);
        return 'init done';
    },
    arweave: null,
    loggedIn: false,
    jwk: false,
    address: false,
    balance: false,
    login: async function (jwk) {
        this.jwk = jwk;
        try {
            if (typeof beforeLogin === 'function') beforeLogin();
            this.arweave.wallets.jwkToAddress(jwk).then((address) => {
                this.address = address;
                this.loggedIn = true;
                this.arweave.wallets.getBalance(address).then((balance) => {
                    let winston = balance;
                    let _ar = this.arweave.ar.winstonToAr(balance);
                    this.balance = {
                        winston: winston,
                        ar: _ar,
                    };
                    if (typeof onLoginSuccess === 'function') onLoginSuccess();
                });
            });
        } catch (e) {
            if (typeof onLoginError === 'function') onLoginError(e);
        }
    },
    submitTrans: async function (data, tag_obj) {
        if (!this.loggedIn) throw ('You need login first');
        let tx = await this.arweave.createTransaction({
            data: data,
        }, this.jwk);
        $.each(tag_obj, function (key, value) {
            tx.addTag(key, value);
        });
        await this.arweave.transactions.sign(tx, this.jwk);
        return await this.arweave.transactions.post(tx);
    },
};