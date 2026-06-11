package com.cny.backend.chat.dto;

public class ChatReadReceiptDto {
    private String type = "READ_RECEIPT";
    private Integer ticketId;
    private String readerRole;
    private Integer readerId;

    public ChatReadReceiptDto() {
    }

    public ChatReadReceiptDto(Integer ticketId, String readerRole, Integer readerId) {
        this.ticketId = ticketId;
        this.readerRole = readerRole;
        this.readerId = readerId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public Integer getTicketId() {
        return ticketId;
    }

    public void setTicketId(Integer ticketId) {
        this.ticketId = ticketId;
    }

    public String getReaderRole() {
        return readerRole;
    }

    public void setReaderRole(String readerRole) {
        this.readerRole = readerRole;
    }

    public Integer getReaderId() {
        return readerId;
    }

    public void setReaderId(Integer readerId) {
        this.readerId = readerId;
    }
}
