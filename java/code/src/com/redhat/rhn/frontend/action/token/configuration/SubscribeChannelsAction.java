/**
 * Copyright (c) 2008 Red Hat, Inc.
 *
 * This software is licensed to you under the GNU General Public License,
 * version 2 (GPLv2). There is NO WARRANTY for this software, express or
 * implied, including the implied warranties of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. You should have received a copy of GPLv2
 * along with this software; if not, see
 * http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
 * 
 * Red Hat trademarks are not licensed under GPLv2. No permission is
 * granted to use or replicate Red Hat trademarks that are incorporated
 * in this software or its documentation. 
 */

package com.redhat.rhn.frontend.action.token.configuration;

import com.redhat.rhn.domain.config.ConfigChannel;
import com.redhat.rhn.domain.config.ConfigChannelListProcessor;
import com.redhat.rhn.domain.config.ConfigurationFactory;
import com.redhat.rhn.domain.token.ActivationKey;
import com.redhat.rhn.domain.user.User;
import com.redhat.rhn.frontend.struts.RequestContext;
import com.redhat.rhn.frontend.struts.SessionSetHelper;
import com.redhat.rhn.frontend.struts.StrutsDelegate;
import com.redhat.rhn.frontend.taglibs.list.ListSessionSetHelper;
import com.redhat.rhn.frontend.taglibs.list.ListSubmitable;
import com.redhat.rhn.manager.configuration.ConfigurationManager;

import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


/**
 * @author paji
 * SubscribeChannelsAction
 * @version $Rev$
 */
public class SubscribeChannelsAction extends 
            BaseChannelsAction implements ListSubmitable {
    public static final String WIZARD_MODE = "wizardMode";
    /** {@inheritDoc} */
    public ActionForward execute(ActionMapping mapping,
                                 ActionForm formIn,
                                 HttpServletRequest request,
                                 HttpServletResponse response) {
        
        setup(request);
        ListSessionSetHelper helper = new ListSessionSetHelper(this);
        //we want the set to be preserved for the rank channels page
        //so don;t obliterate it.
        helper.preserveSetOnCompletion();
        return helper.execute(mapping, formIn, request, response);
    }

    /** {@inheritDoc} */
    public ActionForward handleDispatch(ActionMapping mapping,
            ActionForm formIn, HttpServletRequest request,
            HttpServletResponse response) {
        RequestContext context = new RequestContext(request);
        ActivationKey key = context.lookupAndBindActivationKey();
        User user = context.getLoggedInUser();
        Set <String> set = SessionSetHelper.lookupAndBind(context.getRequest(),
                                                                getDecl(context));
        if (set.size() == 1 && key.getConfigChannelsFor(user).isEmpty()) {
            return handleSingleAdd(mapping, context, set.iterator().next());
        }
        Map params = new HashMap();
        params.put(RequestContext.TOKEN_ID, key.getToken().getId().toString());
        params.put(WIZARD_MODE, "true");
        StrutsDelegate strutsDelegate = getStrutsDelegate();
        return strutsDelegate.forwardParams
                        (mapping.findForward("rank"), params);
    }
    
    private ActionForward handleSingleAdd(ActionMapping mapping, 
                                            RequestContext context, String id) {
        ActivationKey key = context.lookupAndBindActivationKey();
        User user = context.getLoggedInUser();
        ConfigChannel ch = ConfigurationFactory.lookupConfigChannelById(Long.valueOf(id));
     
        ConfigChannelListProcessor proc = new ConfigChannelListProcessor();
        
        proc.add(key.getConfigChannelsFor(user), ch);
        String[] params = {key.getNote()};
        getStrutsDelegate().saveMessage("sdc.config.rank.jsp.success", 
                                                    params, context.getRequest());
        
        SessionSetHelper.obliterate(context.getRequest(), getDecl(context));
        
        return getStrutsDelegate().forwardParam(mapping.findForward("singleAdd"),
                RequestContext.TOKEN_ID, key.getId().toString());        
    }
    
    
    /** {@inheritDoc} */
    public List getResult(RequestContext context) {
        ConfigurationManager cm = ConfigurationManager.getInstance();
        return cm.listGlobalChannelsForActivationKeySubscriptions(
                        context.lookupAndBindActivationKey(),
                        context.getLoggedInUser());
    }
}
