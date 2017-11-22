package com.suse.manager.webui.utils.gson;

import com.redhat.rhn.domain.notification.NotificationMessage;

import org.apache.commons.lang.builder.EqualsBuilder;
import org.apache.commons.lang.builder.HashCodeBuilder;
import org.apache.commons.lang.builder.ToStringBuilder;

import java.util.Date;

/**
 * A notification JSONNotificationMessage Object.
 */
public class JSONNotificationMessage {

    private Long id;
    private String severity;
    private String description;
    private boolean isRead;
    private Date created;
    private Date modified;

    /**
     * Empty constructor
     */
    public JSONNotificationMessage() {
    }

    /**
     * Default constructor for a JSONNotificationMessage
     *
     */
    public JSONNotificationMessage(NotificationMessage nm) {
        this.id = nm.getId();
        this.severity = nm.getSeverity().toString();
        this.description = nm.getDescription();
        this.isRead = nm.getIsRead();
    }

    /**
     * @return Returns the id.
     */
    public Long getId() {
        return id;
    }

    /**
     * @param idIn The id to set.
     */
    public void setId(Long idIn) {
        this.id = idIn;
    }

    /**
     * @return Returns the description.
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param descriptionIn The description to set.
     */
    public void setDescription(String descriptionIn) {
        this.description = descriptionIn;
    }

    /**
     * @return Returns the read.
     */
    public boolean getIsRead() {
        return isRead;
    }

    /**
     * @param isReadIn The read to set.
     */
    public void setIsRead(boolean isReadIn) {
        this.isRead = isReadIn;
    }

    /**
     * @return Returns the created date.
     */
    public Date getCreated() {
        return created;
    }

    /**
     * @param createdIn The created date to set.
     */
    public void setCreated(Date createdIn) {
        this.created = createdIn;
    }

    /**
     * @return Returns the modified date.
     */
    public Date getModified() {
        return modified;
    }

    /**
     * @param modifiedIn The modified date to set.
     */
    public void setModified(Date modifiedIn) {
        this.modified= modifiedIn;
    }

    /**
     * @return Returns the severity.
     */
    public String getType() {
        return severity;
    }

    /**
     * @param severityIn The severity to set.
     */
    public void setSeverity(String severityIn) {
        this.severity = severityIn;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean equals(Object other) {
        if (!(other instanceof JSONNotificationMessage)) {
            return false;
        }
        JSONNotificationMessage otherNotificationMessage = (JSONNotificationMessage) other;
        return new EqualsBuilder()
            .append(getDescription(), otherNotificationMessage.getDescription())
            .append(getCreated(), otherNotificationMessage.getCreated())
            .append(getIsRead(), otherNotificationMessage.getIsRead())
            .isEquals();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public int hashCode() {
        return new HashCodeBuilder()
            .append(getDescription())
            .append(getCreated())
            .toHashCode();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String toString() {
        return new ToStringBuilder(this)
            .append("id", getId())
            .append("description", getDescription())
            .append("created", getCreated())
            .append("isRead", getIsRead())
            .toString();
    }
}
