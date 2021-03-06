<%@ taglib uri="http://struts.apache.org/tags-html" prefix="html" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://rhn.redhat.com/rhn" prefix="rhn" %>
<%@ taglib uri="http://struts.apache.org/tags-bean" prefix="bean" %>
<%@ taglib uri="http://rhn.redhat.com/tags/list" prefix="rl" %>


<html>
<body>
<rhn:toolbar base="h1" icon="header-action"
                           imgAlt="actions.jsp.imgAlt"
               helpUrl="/docs/reference/schedule/failed-actions.html">
    <bean:message key="failedactions.jsp.failed_actions"/>
  </rhn:toolbar>
    <p>
    <bean:message key="failedactions.jsp.summary"/>
    </p>
    <p>
      <span class="small-text"><bean:message key="actions.jsp.totalnote"/></span>
    </p>
        <rl:listset name="failedList">
            <rhn:csrf/>
            <rhn:submitted/>
            <div class="spacewalk-section-toolbar">
                <div class="action-button-wrapper">
                     <input type="submit" name="dispatch" class="btn btn-default"
                            value='<bean:message key="actions.jsp.archiveactions"/>'/>
                </div>
            </div>
            <rl:list emptykey="failedactions.jsp.nogroups" styleclass="list">
                <%@ include file="/WEB-INF/pages/common/fragments/scheduledactions/listdisplay-new.jspf" %>
            </rl:list>
        </rl:listset>
</body>
</html>
