import dns from "dns";

/**
 * Validates the domain of an email address by checking its existence and DNS MX records.
 * Uses dns.lookup (OS resolver) first for reliability, then checks MX records.
 * 
 * @param {string} email - The email address to validate.
 * @returns {Promise<boolean>} - Resolves to true if the domain exists and is valid.
 */
export const isValidEmailDomain = (email) => {
    return new Promise((resolve) => {
        if (!email || typeof email !== "string") {
            return resolve(false);
        }

        // 1. Basic regex check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return resolve(false);
        }

        // 2. Extract domain
        const domain = email.split("@")[1];
        if (!domain) {
            return resolve(false);
        }

        // 3. Check domain existence using OS resolver first
        dns.lookup(domain, (lookupErr) => {
            if (lookupErr && lookupErr.code === "ENOTFOUND") {
                console.log(`DNS lookup: Domain "${domain}" does not exist.`);
                return resolve(false);
            }

            // 4. DNS MX Lookup with 3-second timeout
            const timeout = setTimeout(() => {
                console.warn(`DNS MX resolution timed out for domain: ${domain}. Proceeding as valid.`);
                resolve(true);
            }, 3000);

            dns.resolveMx(domain, (mxErr, addresses) => {
                clearTimeout(timeout);
                
                if (mxErr) {
                    console.log(`DNS MX lookup failed for domain "${domain}":`, mxErr.code || mxErr.message);
                    // If domain lookup fails because domain doesn't exist or has no record, reject
                    if (mxErr.code === "ENOTFOUND" || mxErr.code === "ENODATA") {
                        return resolve(false);
                    }
                    // For other transient network errors, proceed as valid
                    return resolve(true);
                }

                if (!addresses || addresses.length === 0) {
                    return resolve(false);
                }

                resolve(true);
            });
        });
    });
};
