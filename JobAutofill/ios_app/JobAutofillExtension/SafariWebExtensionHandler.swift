import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    // Logger for debugging
    let logger = Logger(subsystem: "com.yourcompany.JobAutofill.JobAutofillExtension", category: "Extension")
    
    func beginRequest(with context: NSExtensionContext) {
        // Get the app group identifier for shared container
        let appGroupIdentifier = "group.com.yourcompany.jobautofill"
        
        // Get the item request
        let item = context.inputItems[0] as? NSExtensionItem
        
        // Get the message from the JavaScript
        let message = item?.userInfo?[SFExtensionMessageKey] as? [String: Any]
        
        // Log the received message
        logger.log("Received message from browser.runtime.sendNativeMessage: \(String(describing: message))")
        
        // Process the message
        var response: [String: Any]? = nil
        
        if let message = message {
            // Handle different message actions
            if let action = message["action"] as? String {
                switch action {
                case "getUserData":
                    // Get user data from shared UserDefaults
                    response = getUserData(appGroupIdentifier: appGroupIdentifier)
                    
                default:
                    logger.error("Unhandled action: \(action)")
                    response = ["error": "Unhandled action: \(action)"]
                }
            } else {
                logger.error("No action specified in message")
                response = ["error": "No action specified in message"]
            }
        } else {
            logger.error("No message received")
            response = ["error": "No message received"]
        }
        
        // Create response item
        let responseItem = NSExtensionItem()
        responseItem.userInfo = [SFExtensionMessageKey: response ?? [:]]
        
        // Complete request
        context.completeRequest(returningItems: [responseItem], completionHandler: nil)
    }
    
    // Get user data from shared UserDefaults
    private func getUserData(appGroupIdentifier: String) -> [String: Any] {
        guard let sharedDefaults = UserDefaults(suiteName: appGroupIdentifier) else {
            logger.error("Failed to access shared UserDefaults")
            return ["error": "Failed to access shared UserDefaults"]
        }
        
        // Get extension message from shared UserDefaults
        if let messageData = sharedDefaults.data(forKey: "extensionMessage") {
            do {
                // Parse JSON data
                if let message = try JSONSerialization.jsonObject(with: messageData, options: []) as? [String: Any] {
                    // Return the user data
                    if let userData = message["userData"] as? [String: Any] {
                        logger.log("Retrieved user data successfully")
                        return ["userData": userData]
                    } else {
                        logger.error("No userData in message")
                        return ["error": "No userData in message"]
                    }
                } else {
                    logger.error("Failed to parse message JSON")
                    return ["error": "Failed to parse message JSON"]
                }
            } catch {
                logger.error("Error parsing message JSON: \(error.localizedDescription)")
                return ["error": "Error parsing message JSON: \(error.localizedDescription)"]
            }
        } else {
            logger.error("No extension message found in shared UserDefaults")
            return ["error": "No extension message found in shared UserDefaults"]
        }
    }
} 