/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

package org.lfenergy.operatorfabric.springtools.config.oauth;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
//import org.springframework.security.oauth2.client.OAuth2ClientContext;

/**
 * <p></p>
 * Created on 17/09/18
 *
 * @author davibind
 */
@Slf4j
public class OAuth2FeignRequestInterceptor implements RequestInterceptor {

    private static final String AUTHORIZATION_HEADER = "Authorization";

    private static final String BEARER_TOKEN_TYPE = "Bearer";

//    private final OAuth2ClientContext oauth2ClientContext;

    public OAuth2FeignRequestInterceptor() {
//        Assert.notNull(oauth2ClientContext, "Context can not be null");
//        this.oauth2ClientContext = oauth2ClientContext;
    }

    @Override
    public void apply(RequestTemplate template) {
        OpFabJwtAuthenticationToken authentication = (OpFabJwtAuthenticationToken) SecurityContextHolder.getContext()
           .getAuthentication();
        Jwt jwt = null;
        if (template.headers().containsKey(AUTHORIZATION_HEADER)) {
            log.warn("The Authorization token has been already set");
        }
        else if(authentication!= null) {
            jwt = authentication.getToken();
        }
        else if (authentication == null) {
            log.info("Cannot obtain token data from security context, checking ThreadLocal");
            jwt = Oauth2GenericConfiguration.token.get();
            if(jwt == null)
                log.warn("Can not obtain existing token for request, if it is a non secured request, ignore.");
        }
        if(jwt!= null)
        {
            log.debug("Constructing Header {} for Token {}", AUTHORIZATION_HEADER, BEARER_TOKEN_TYPE);
            template.header(AUTHORIZATION_HEADER, String.format("%s %s", BEARER_TOKEN_TYPE,
               jwt.getTokenValue()));
        }
    }
}