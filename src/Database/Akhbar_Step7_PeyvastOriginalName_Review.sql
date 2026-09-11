USE [MeratDB]
GO

/* نام اصلی فایل فقط برای نمایش به کاربر نگهداری می‌شود. */
IF COL_LENGTH(N'Akhbar.KhabarPeyvast', N'OriginalFileName') IS NULL
BEGIN
    ALTER TABLE [Akhbar].[KhabarPeyvast]
    ADD [OriginalFileName] NVARCHAR(500) NULL;
END
GO

CREATE OR ALTER PROCEDURE [Akhbar].[SP_InsertKhabarPeyvast]
    @ShomareKhabar BIGINT,
    @FileName NVARCHAR(250),
    @OriginalFileName NVARCHAR(500),
    @Files VARBINARY(MAX),
    @FileSize INT,
    @CreateUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (
        SELECT 1 FROM [dbo].[Users]
        WHERE [UserId] = @CreateUserId AND [IsActive] = 1
    )
        THROW 51000, N'کاربر فعال یافت نشد.', 1;

    IF NOT EXISTS (
        SELECT 1 FROM [Akhbar].[Khabar]
        WHERE [ShomareKhabar] = @ShomareKhabar
          AND [IsDelete] = 0
          AND [CreateUserId] = @CreateUserId
    )
        THROW 51000, N'خبر برای ثبت پیوست یافت نشد یا اجازه ویرایش آن را ندارید.', 1;

    IF NULLIF(LTRIM(RTRIM(@FileName)), N'') IS NULL
       OR NULLIF(LTRIM(RTRIM(@OriginalFileName)), N'') IS NULL
       OR @Files IS NULL OR @FileSize <= 0
        THROW 51000, N'اطلاعات فایل معتبر نیست.', 1;

    IF EXISTS (SELECT 1 FROM [MeratFilesDB].[dbo].[PeyvastFiles] WHERE [FileName] = @FileName)
        THROW 51000, N'نام فایل تکراری است.', 1;

    BEGIN TRAN;

    INSERT INTO [MeratFilesDB].[dbo].[PeyvastFiles]
    (
        [FileName], [Files], [FileSize], [CreateDateTime]
    )
    VALUES
    (
        @FileName, @Files, @FileSize, [dbo].[FarsiDateTimeNow]()
    );

    INSERT INTO [Akhbar].[KhabarPeyvast]
    (
        [ShomareKhabar], [FileName], [OriginalFileName], [CreateUserId], [CreateDateTime]
    )
    VALUES
    (
        @ShomareKhabar, @FileName, LTRIM(RTRIM(@OriginalFileName)), @CreateUserId, [dbo].[FarsiDateTimeNow]()
    );

    DECLARE @KhabarPeyvastId BIGINT = SCOPE_IDENTITY();

    COMMIT;

    SELECT
        @KhabarPeyvastId AS [KhabarPeyvastId],
        @ShomareKhabar AS [ShomareKhabar],
        @FileName AS [FileName],
        LTRIM(RTRIM(@OriginalFileName)) AS [OriginalFileName],
        @FileSize AS [FileSize];
END
GO

CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarPeyvastha]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM [dbo].[Users] WHERE [UserId] = @UserId AND [IsActive] = 1)
        THROW 51000, N'کاربر فعال یافت نشد.', 1;

    SELECT
        KP.[KhabarPeyvastId],
        KP.[ShomareKhabar],
        KP.[FileName],
        KP.[OriginalFileName],
        ISNULL(PF.[FileSize], 0) AS [FileSize],
        ISNULL(PF.[CreateDateTime], KP.[CreateDateTime]) AS [CreateDateTime]
    FROM [Akhbar].[KhabarPeyvast] KP
    LEFT JOIN [MeratFilesDB].[dbo].[PeyvastFiles] PF
        ON PF.[FileName] = KP.[FileName]
    WHERE KP.[ShomareKhabar] = @ShomareKhabar
    ORDER BY KP.[KhabarPeyvastId] ASC;
END
GO

/* نام‌های قابل نمایش در صفحه مرور نهایی */
CREATE OR ALTER PROCEDURE [Akhbar].[SP_GetKhabarById]
    @ShomareKhabar BIGINT,
    @UserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        K.[ShomareKhabar],
        K.[TabaqehBandi], TB.[NameFarsi] AS [TabaqehBandiName],
        K.[ManbaKhabarId], M.[NameFarsi] AS [ManbaKhabarName],
        K.[NoeKhabar], NK.[NameFarsi] AS [NoeKhabarName],
        K.[TarikhNameh], K.[ShomareNameh],
        K.[OnvanKhabar], K.[SharhKhabar], K.[MolahazatKhabar],
        K.[NoghteKhabarkhizId], N.[Onvan] AS [NoghteKhabarkhizName],
        K.[MahalNoghteKhabarkhiz], K.[TarikhEnteshar],
        K.[CreateMahal], K.[CreatePostId],
        K.[CreateUserId], K.[CreateDateTime], K.[LastEditUserId], K.[LastEditDateTime]
    FROM [Akhbar].[Khabar] K
    LEFT JOIN [dbo].[DFN] TB
        ON TB.[ID] = K.[TabaqehBandi] AND TB.[PID] = 71101
    INNER JOIN [dbo].[DFN] M
        ON M.[ID] = K.[ManbaKhabarId] AND M.[PID] = 10201
    LEFT JOIN [dbo].[DFN] NK
        ON NK.[ID] = K.[NoeKhabar] AND NK.[PID] = 71102
    LEFT JOIN [Akhbar].[NoghatKhabarkhiz] N
        ON N.[NoghteKhabarkhizId] = K.[NoghteKhabarkhizId]
    WHERE K.[ShomareKhabar] = @ShomareKhabar
      AND K.[CreateUserId] = @UserId
      AND K.[IsDelete] = 0;
END
GO
