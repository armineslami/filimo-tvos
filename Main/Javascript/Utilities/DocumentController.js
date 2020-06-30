/*
See LICENSE.txt for this sample’s licensing information.

Abstract:
This class provides basic functionality for document controllers; subclassable.
*/

class DocumentController {

    constructor({ documentLoader, documentURL, loadingDocument }) {
        this.handleEvent = this.handleEvent.bind(this);
        this.documentLoader = documentLoader;
        this.dataLoader = new DataLoader(documentLoader, new DataParser());
        this.fetchDocument(documentURL, loadingDocument);
    }

    fetchDocument(documentURL, loadingDocument) {
        this.documentLoader.fetch({
            url: documentURL,
            success: (document) => {
               // Add the event listener for document
               this.setupDocument(document);
               // Allow subclass to do custom handling for this document
               this.handleDocument(document, loadingDocument);
            },
            error: (xhr) => {
                const alertDocument = createLoadErrorAlertDocument(documentURL, xhr, false);
                this.handleDocument(alertDocument, loadingDocument);
            }
        });
    }

    setupDocument(document) {
        document.addEventListener("select", this.handleEvent);
        document.addEventListener("play", this.handleEvent);
        document.addEventListener("unload", this.handleEvent);
        document.addEventListener("appear", this.handleEvent);
    }

    handleDocument(document, loadingDocument) {
        if (loadingDocument) {
            navigationDocument.replaceDocument(document, loadingDocument);
        } else {
            navigationDocument.pushDocument(document);
        }
    }

    handleEvent(event) {
        switch (event.type) {
            case "select":
            case "play":
                const targetElem = event.target;
                let controllerOptions = resolveControllerFromElement(targetElem);
                if (controllerOptions) {
                    const controllerClass = controllerOptions.type;
                    if (!controllerClass.preventLoadingDocument) {
                        let loadingDocument = createLoadingDocument();
                        navigationDocument.pushDocument(loadingDocument);
                        controllerOptions.loadingDocument = loadingDocument;
                    }
                    controllerOptions.event = event;
                    controllerOptions.documentLoader = this.documentLoader;
                    // Create the subsequent controller based on the attribute and its value. Controller would handle its presentation.
                    new controllerClass(controllerOptions);
                }
                else if (targetElem.tagName === "description") {
                    // Handle description tag, if no URL was specified
                    const body = targetElem.textContent;
                    const alertDocument = createDescriptiveAlertDocument('', body);
                    navigationDocument.presentModal(alertDocument);
                } else if (targetElem.tagName === 'reviewCard') {
                    // Handle reviewCard tag, if no URL was specified
                    const title = targetElem.getElementsByTagName('title').item(0).textContent
                    const body = targetElem.getElementsByTagName('description').item(0).textContent

                    const alertDocument = createDescriptiveAlertDocument(title, body);
                    navigationDocument.presentModal(alertDocument);
                }
                return createLoadingDocument();
            default:
                break;
        }
    }
}
registerAttributeName("documentURL", DocumentController);
