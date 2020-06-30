class LoginController extends DocumentController {

    constructor(controllerOptions) {
        super(controllerOptions)        
        this._presenter = controllerOptions.event.target.parentClass
    }

    verificationCodeReceived(code, document) {
        document.getElementById("verificationCode").textContent = code.toUpperCase()

        let dataLoader = this.dataLoader
        let documentLoader = this.documentLoader
        let refreshIntervalId = setInterval(function() {
            let verifyURL = legacyBaseURL + '/verifycodecheck/ref_type/tv/code/'
            + code
            dataLoader._fetchJSONData(documentLoader.prepareURL(verifyURL), (dataObj) => {
            let token = dataObj.verifycodecheck.ltoken
            if (token != null && token != undefined) {
                clearInterval(refreshIntervalId)
                localStorage.setItem("token", token)
                localStorage.setItem("username", dataObj.verifycodecheck.username)
                navigationDocument.popDocument()
            }
        })
        }, 5000)
        this._refreshIntervalId = refreshIntervalId
    }

    setupDocument(document) {
        super.setupDocument(document)

        let verifyCodeGetURL = legacyBaseURL + '/verifycodeget'
        this.dataLoader._fetchJSONData(this.documentLoader.prepareURL(verifyCodeGetURL), (dataObj) => {
            this.verificationCodeReceived(dataObj.verifycodeget.code, document)
        })
    }

    handleEvent(event) {
        if (event.type === "unload") {
            clearInterval(this._refreshIntervalId)
        }
        super.handleEvent(event)
    }
}
registerAttributeName("loginDocumentURL", LoginController)