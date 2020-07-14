/**
 * Copyright (c) 2009--2010 Red Hat, Inc.
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
package com.redhat.rhn.domain.entitlement.test;

import com.redhat.rhn.GlobalInstanceHolder;
import com.redhat.rhn.domain.entitlement.Entitlement;
import com.redhat.rhn.domain.server.Server;
import com.redhat.rhn.manager.entitlement.EntitlementManager;
import com.redhat.rhn.manager.formula.FormulaManager;
import com.redhat.rhn.manager.formula.FormulaMonitoringManager;
import com.redhat.rhn.manager.system.ServerGroupManager;
import com.redhat.rhn.manager.system.entitling.SystemEntitlementManager;
import com.redhat.rhn.manager.system.entitling.SystemEntitler;
import com.redhat.rhn.manager.system.entitling.SystemUnentitler;
import com.redhat.rhn.testing.BaseTestCaseWithUser;
import com.redhat.rhn.testing.ServerTestUtils;
import com.suse.manager.clusters.ClusterManager;
import com.suse.manager.virtualization.VirtManagerSalt;
import com.suse.manager.webui.services.iface.MonitoringManager;
import com.suse.manager.webui.services.iface.SaltApi;
import com.suse.manager.webui.services.iface.SystemQuery;
import com.suse.manager.webui.services.iface.VirtManager;
import com.suse.manager.webui.services.impl.SaltService;

/**
 * BaseEntitlementTestCase
 * @version $Rev$
 */
public abstract class BaseEntitlementTestCase extends BaseTestCaseWithUser {

    protected Entitlement ent;

    private final SaltService saltService = new SaltService();
    private final SystemQuery systemQuery = saltService;
    private final SaltApi saltApi = saltService;
    private final ServerGroupManager serverGroupManager = new ServerGroupManager();
    private final VirtManager virtManager = new VirtManagerSalt(saltApi);
    private final MonitoringManager monitoringManager = new FormulaMonitoringManager();
    private final SystemEntitlementManager systemEntitlementManager = new SystemEntitlementManager(
            new SystemUnentitler(virtManager, monitoringManager, serverGroupManager),
            new SystemEntitler(systemQuery, virtManager, monitoringManager, serverGroupManager)
    );

    @Override
    public void setUp() throws Exception {
        super.setUp();
        createEntitlement();
    }

    public void testLabel() {
        assertEquals(getLabel(), ent.getLabel());
    }


    public void testIsAllowedOnServer() throws Exception {
        Server traditional = ServerTestUtils.createTestSystem(user);
        Server foreign = ServerTestUtils.createForeignSystem(user, "9999");

        systemEntitlementManager.setBaseEntitlement(traditional, EntitlementManager.MANAGEMENT);
        systemEntitlementManager.setBaseEntitlement(foreign, EntitlementManager.FOREIGN);

        assertTrue(traditional.getValidAddonEntitlementsForServer().size() > 0);
        assertTrue(foreign.getValidAddonEntitlementsForServer().size() == 0);
    }

    public void testIsAllowedOnServerWithGrains() throws Exception {
        Server traditional = ServerTestUtils.createTestSystem(user);
        Server foreign = ServerTestUtils.createForeignSystem(user, "9999");

        systemEntitlementManager.setBaseEntitlement(traditional, EntitlementManager.MANAGEMENT);
        systemEntitlementManager.setBaseEntitlement(foreign, EntitlementManager.FOREIGN);

        assertTrue(ent.isAllowedOnServer(traditional, null));
        assertFalse(ent.isAllowedOnServer(foreign, null));
    }

    protected abstract void createEntitlement();
    protected abstract String getLabel();

}
